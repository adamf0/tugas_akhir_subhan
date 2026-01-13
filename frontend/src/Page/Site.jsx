import { useEffect, useState } from "react";
import CardSite from "../components/CardSite";
import { FiTrash2, FiLink, FiGlobe } from "react-icons/fi";
import {
  FiFileText,
  FiCalendar,
  FiDownload,
  FiTag,
  FiClock,
  FiLayers,
  FiAlertTriangle,
  FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_NODE_ENV === "development" || import.meta.env.VITE_NODE_ENV === null || import.meta.env.VITE_NODE_ENV === undefined
    ? "http://localhost:3000"
    : "";

export default function Site() {
  const [siteData, setSiteData] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Ambil registry sites
      const resRegis = await fetch(`${API_URL}/registry`);
      const dataRegis = await resRegis.json();

      // Ambil sitemap untuk setiap site
      const promises = dataRegis.map(async (regis) => {
        try {
          const resSitemap = await fetch(
            `${API_URL}/sitemaps?site_url=${encodeURIComponent(
              regis.siteUrl
            )}`
          );
          const dataSitemap = await resSitemap.json();
          regis.info = dataSitemap?.data ?? [];
        } catch (err) {
          regis.info = [];
        }
        return regis;
      });

      const combinedData = await Promise.all(promises);
      setSiteData(combinedData);
    } catch (err) {
      console.error("Error fetching registry:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteTarget = (target) => setDeleteTarget(target);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setLoadingDelete(true);
    try {
      const res = await fetch(
        `${API_URL}/delete?url=${encodeURIComponent(deleteTarget)}`
      );
      const data = await res.json();

      if (data.status === "DELETED") {
        alert(
          `Permintaan hapus ${deleteTarget} pada Google Search Console telah dikirim. Tunggu beberapa hari agar terhapus dari Google.`
        );
      } else {
        alert(
          `Permintaan hapus ${deleteTarget} gagal! Ada masalah pada service Google.`
        );
      }
    } catch (err) {
      console.error(err);
      alert(`Terjadi error saat menghapus ${deleteTarget}`);
    } finally {
      setLoadingDelete(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    if (!loadingDelete) setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Sites</h1>

      {loading && <p>Loading...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {siteData.map((site, idx) => (
          <CardSite
            key={idx}
            site={site}
            onClick={() => setSelectedSite(site.siteUrl)}
          />
        ))}
      </div>

      {/* Details */}
      {selectedSite && (
        <div className="mt-8 p-6 border rounded-lg shadow bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Details for: {selectedSite}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSite(null)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Close
              </button>
              {!selectedSite.includes("sc-domain:") && (
                <Link
                  to={selectedSite}
                  target="_blank"
                  className="px-4 py-2 text-blue-500 rounded hover:bg-blue-500 hover:text-white"
                >
                  Open Site
                </Link>
              )}
            </div>
          </div>

          {siteData
            .filter((s) => s.siteUrl === selectedSite)
            .map((site, idx) => (
              <div key={idx}>
                {site.info && site.info.length > 0 ? (
                  site.info.map((d, didx) => (
                    <div
                      key={didx}
                      className="mt-4 p-4 border rounded bg-white dark:bg-gray-700 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <FiGlobe className="text-blue-500" />
                        Path: <Link
                          to={d.path}
                          className="text-blue-500 hover:text-blue-600 truncate max-w-lg"
                          target="_blank"
                        >
                          {d.path}
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-green-500" />
                        <span>
                          Last Submitted: {new Date(d.lastSubmitted).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiDownload className="text-purple-500" />
                        <span>
                          Last Downloaded: {new Date(d.lastDownloaded).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiTag className="text-yellow-500" />
                        <span>Type: {d.type}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiClock className="text-orange-500" />
                        <span>Pending: {d.isPending ? "Yes" : "No"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiLayers className="text-teal-500" />
                        <span>Sitemap Index: {d.isSitemapsIndex ? "Yes" : "No"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiAlertTriangle className="text-yellow-600" />
                        <span>Warnings: {d.warnings}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiXCircle className="text-red-500" />
                        <span>Errors: {d.errors}</span>
                      </div>

                      {/* Contents */}
                      <div>
                        <p className="font-semibold">Contents:</p>
                        {d.contents.map((c, cidx) => (
                          <p key={cidx}>
                            Type: {c.type}, Submitted: {c.submitted}, Indexed:{" "}
                            {c.indexed}
                          </p>
                        ))}
                      </div>

                      {/* Targets */}
                      <div>
                        <p className="font-semibold">Targets:</p>
                        <ul className="space-y-1">
                          {d.targets.map((t, tidx) => (
                            <li
                              key={tidx}
                              className="flex justify-between items-center p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              <div className="flex items-center gap-2">
                                <FiLink className="text-blue-500" />
                                <Link
                                  to={t}
                                  target="_blank"
                                  className="text-blue-500 hover:text-blue-600 truncate max-w-lg"
                                >
                                  {t}
                                </Link>
                              </div>
                              <button
                                onClick={() => handleDeleteTarget(t)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-600"
                              >
                                <FiTrash2 className="text-red-500" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No additional details available for this site.</p>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Modal Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h4 className="font-bold text-lg mb-4">Confirm Delete</h4>
            <p className="mb-4">Are you sure you want to delete:</p>
            <p className="mb-4 font-mono text-sm truncate">{deleteTarget}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                disabled={loadingDelete}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loadingDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {loadingDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
