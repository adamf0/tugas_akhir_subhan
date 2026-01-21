import { useEffect, useState } from "react";
import CardSite2 from "@/Components/CardSite2";

const API_URL =
  import.meta.env.VITE_NODE_ENV === "development" ||
  !import.meta.env.VITE_NODE_ENV
    ? "http://localhost:3000"
    : "";

export default function Removal() {
  const [listHistory, setListHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [listTarget, setListTarget] = useState([]);

  /* =====================
     FILE HANDLING
  ====================== */
  function handleFileSelect(e) {
    const selected = e.target.files[0];
    validateFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    validateFile(dropped);
  }

  function validateFile(selected) {
    if (!selected) return;

    if (selected.name !== "sitemap.xml") {
      alert("Hanya file sitemap.xml yang diperbolehkan");
      return;
    }

    setFile(selected);
    uploadSitemap(selected);
  }

  /* =====================
     UPLOAD SITEMAP
  ====================== */
  async function uploadSitemap(selectedFile) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("sitemap", selectedFile);

      const res = await fetch(`${API_URL}/upload-sitemap`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload sitemap");

      const result = await res.json();

      const targets = (result?.data ?? []).map((url) => ({
        url,
        state: "idle", // idle | loading | deleted | error
        message: null,
      }));

      setListTarget(targets);
    } catch (err) {
      alert(err.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  /* =====================
     DELETE SINGLE (RETRY)
  ====================== */
  async function deleteSingleTarget(target) {
    setListTarget((prev) =>
      prev.map((t) =>
        t.url === target.url ? { ...t, state: "loading", message: null } : t
      )
    );

    try {
      const res = await fetch(
        `${API_URL}/delete?url=${encodeURIComponent(target.url)}`
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Gagal delete");
      }

      setListTarget((prev) =>
        prev.map((t) =>
          t.url === target.url ? { ...t, state: "deleted" } : t
        )
      );
    } catch (err) {
      setListTarget((prev) =>
        prev.map((t) =>
          t.url === target.url
            ? { ...t, state: "error", message: err.message }
            : t
        )
      );
    }
  }

  /* =====================
     BULK DELETE (PARALEL)
  ====================== */
  async function deleteAllTargets() {
    setListTarget((prev) =>
      prev.map((t) =>
        t.state === "deleted" ? t : { ...t, state: "loading", message: null }
      )
    );

    const tasks = listTarget
      .filter((t) => t.state !== "deleted")
      .map(async (target, index) => {
        try {
          const res = await fetch(
            `${API_URL}/delete?url=${encodeURIComponent(target.url)}`
          );

          if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Gagal delete");
          }

          return { url: target.url, state: "deleted" };
        } catch (err) {
          return {
            url: target.url,
            state: "error",
            message: err.message,
          };
        }
      });

    const results = await Promise.all(tasks);

    setListTarget((prev) =>
      prev.map((t) => {
        const r = results.find((x) => x.url === t.url);
        return r ? { ...t, ...r } : t;
      })
    );

    loadData();
  }

  /* =====================
     LOAD HISTORY
  ====================== */
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const resLogs = await fetch(`${API_URL}/logs`);
      const dataLogs = await resLogs.json();
      setListHistory(dataLogs?.data ?? []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =====================
     RENDER
  ====================== */
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Removal Judol</h1>

      {/* UPLOAD BOX */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
      >
        <input
          type="file"
          accept=".xml"
          onChange={handleFileSelect}
          className="hidden"
          id="fileInput"
        />

        <label htmlFor="fileInput" className="cursor-pointer">
          <p className="font-semibold">Drag & drop sitemap.xml di sini</p>
          <p className="text-sm text-gray-500">atau klik untuk memilih file</p>
        </label>

        {uploading && (
          <div className="mt-4">
            <button
              disabled
              className="px-4 py-2 bg-blue-600 text-white rounded opacity-50"
            >
              Parsing data...
            </button>
          </div>
        )}
      </div>

      {/* TARGET URL */}
      {listTarget.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Target URL</h2>
            <button
              onClick={deleteAllTargets}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded"
            >
              Hapus Semua
            </button>
          </div>

          {listTarget.map((item, idx) => (
            <div key={idx} className="p-4 border rounded-lg bg-white space-y-1">
              <span className="text-sm break-all">{item.url}</span>

              {item.state === "loading" && (
                <p className="text-xs text-blue-600">Menghapus...</p>
              )}

              {item.state === "deleted" && (
                <p className="text-xs text-green-600">Berhasil dihapus</p>
              )}

              {item.state === "error" && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-600">{item.message}</p>
                  <button
                    onClick={() => deleteSingleTarget(item)}
                    className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded"
                  >
                    Hapus ulang
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HISTORY */}
      {loading && <p>Loading...</p>}

      {listHistory.length === 0 && !loading && (
        <div className="p-6 border rounded-lg bg-white text-center">
          <h3 className="font-bold text-lg">
            Tidak ada history penghapusan link judol
          </h3>
        </div>
      )}

      <h2 className="text-xl font-semibold">History Delete URL</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listHistory.map((site, idx) => (
          <CardSite2 key={idx} site={site} />
        ))}
      </div>
    </div>
  );
}
