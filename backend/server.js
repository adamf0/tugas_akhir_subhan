import express from "express";
import { google } from "googleapis";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import pLimit from "p-limit";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs/promises";
import fsSync from "fs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // optional: max 5MB
  },
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
  origin: "*", // semua origin
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const LOG_FILE = path.join(__dirname, "deleted-urls.json");

function logDeletedUrl(url) {
  const now = new Date().toISOString();

  let logs = [];

  if (fsSync.existsSync(LOG_FILE)) {
    try {
      const raw = fsSync.readFileSync(LOG_FILE, "utf8");
      logs = JSON.parse(raw || "[]");
    } catch {
      logs = [];
    }
  }

  logs.push({
    url,
    datetime: now,
  });

  fsSync.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// ================= CONFIG =================
const PORT = 3000;

// HARUS PERSIS seperti di /registry (trailing slash penting)
// const SITE_URL = "https://lib.unpak.ac.id/";

// path ke service account JSON
const KEYFILE = "./pc-api-5351586368331448747-1-9502f73ca359.json";

// batas concurrency (aman untuk indexing API)
const CONCURRENCY = 5;

// ================= GOOGLE AUTH =================
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/indexing",
  ],
});

// top-level await (Node 18+ + "type": "module")
const authClient = await auth.getClient();

const searchConsole = google.searchconsole({
  version: "v1",
  auth: authClient,
});

const indexing = google.indexing({
  version: "v3",
  auth: authClient,
});

const limit = pLimit(CONCURRENCY);

// ================= HELPERS =================

/**
 * Ambil semua URL dari sitemap (support sitemap index & sitemap biasa)
 * ❗ Sitemap HARUS valid XML (ampersand = &amp;)
 */
async function getUrlsFromSitemap(sitemapUrl) {
  try {
    const res = await fetch(sitemapUrl, {
      redirect: "follow",
      headers: {
        // INI PENTING
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "application/xml,text/xml,*/*",
      },
    });

    console.log("FETCH:", sitemapUrl, res.status);

    const body = await res.text();

    if (!res.ok) {
      console.error("❌ FETCH FAILED:", res.status);
      console.error(body.slice(0, 300));
      return [];
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("xml")) {
      console.error("❌ BUKAN XML:", sitemapUrl);
      console.error(body.slice(0, 300));
      return [];
    }

    const json = await parseStringPromise(body, {
      strict: true,
      trim: true,
    });

    if (json.sitemapindex?.sitemap) {
      const sitemapUrls = json.sitemapindex.sitemap.map(s => s.loc[0]);
      const nested = await Promise.all(
        sitemapUrls.map(getUrlsFromSitemap)
      );
      return nested.flat();
    }

    if (json.urlset?.url) {
      return json.urlset.url.map(u => u.loc[0]);
    }

    return [];
  } catch (err) {
    console.error("❌ NETWORK ERROR:", sitemapUrl);
    console.error(err.message);
    return [];
  }
}


/**
 * Ambil sitemap dari Search Console
 */
async function getSitemaps(site_url) {
  const res = await searchConsole.sitemaps.list({
    siteUrl: site_url,
  });

  const sitemaps = res.data.sitemap || [];

  for (const sitemap of sitemaps) {
    const urls = await getUrlsFromSitemap(sitemap.path);
    sitemap.targets = urls;
  }

  return sitemaps;
}

/**
 * Kirim perintah delete URL ke Google Index
 */
async function deleteIndex(url) {
  return indexing.urlNotifications.publish({
    requestBody: {
      url,
      type: "URL_DELETED",
    },
  });
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ================= ROUTES =================

// ================= PEMBACAAN TERDAFTARNYA WEB PADA GSC =================
/**
 * GET /registry
 * List semua property Search Console
 */
app.get("/registry", async (req, res) => {
  try {
    const sites = await searchConsole.sites.list();
    res.json(sites.data?.siteEntry ?? []);
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

// ================= PEMBACAAN SITEMAP YG TERDAFTAR PADA GSC =================
/**
 * GET /sitemaps
 * List sitemap + isi URL-nya
 */
app.get("/sitemaps", async (req, res) => {
  try {
    const siteUrl = req.query.site_url;
    if(!siteUrl){
      res.json({
        total: null,
        data: [],
      });
    }

    const sitemaps = await getSitemaps(siteUrl);
    res.json({
      total: sitemaps.length,
      data: sitemaps,
    });
  } catch (e) {
    res.status(500).json({
      error: e.response?.data || e.message,
    });
  }
});

// ================= PENGHAPUSAN LINK SITEMAP (BULK REMOVAL) =================
/**
 * GET /delete?url=...&dryRun=true
 * Hapus URL dari Google Index (BUKAN dari sitemap.xml)
 */
app.get("/delete", async (req, res) => {
  const url = req.query.url;
  const dryRun = req.query.dryRun === "true";

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      error: "Parameter url tidak valid",
    });
  }

  try {
    if (dryRun) {
      return res.json({
        url,
        status: "DRY_RUN",
      });
    }

    await deleteIndex(url);
    logDeletedUrl(url);

    res.json({
      url,
      status: "DELETED",
    });
  } catch (e) {
    res.status(500).json({
      url,
      status: "FAILED",
      error: e.response?.data || e.message,
    });
  }
});

// ================= MENDAPATKAN DATA URL SITEMAP (BULK REMOVAL) =================
app.post("/upload-sitemap", upload.single("sitemap"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    // Ambil XML langsung dari memory
    const xml = req.file.buffer.toString("utf8");

    const parsed = await parseStringPromise(xml, {
      trim: true,
      strict: true,
    });

    const urls =
      parsed?.urlset?.url
        ?.map((u) => u.loc?.[0])
        .filter(Boolean) ?? [];

    res.json({
      total: urls.length,
      data: urls,
    });
  } catch (err) {
    console.error("UPLOAD SITEMAP ERROR:", err.message);
    res.status(500).json({
      error: "Gagal parse sitemap",
      message: err.message,
    });
  }
});

// ================= FITUR HISTORY PENGHAPUSAN URL =================
app.get("/logs", (req, res) => {
  try {
    if (!fsSync.existsSync(LOG_FILE)) { // error: fs.existsSync is not a function
      return res.json({
        total: 0,
        data: [],
      });
    }

    const raw = fsSync.readFileSync(LOG_FILE, "utf8");
    const data = JSON.parse(raw || "[]");

    res.json({
      total: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: "Gagal membaca log",
      message: err.message,
    });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});
