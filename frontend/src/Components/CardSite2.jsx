import { FiCalendar, FiGlobe, FiLock } from "react-icons/fi";

function formatWIB(datetime) {
  if (!datetime) return "-";

  const date = new Date(datetime);

  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + " WIB";
}

export default function CardSite2({ site }) {
  return (
    <div className="cursor-pointer p-6 border rounded-lg shadow hover:shadow-lg bg-white transition flex flex-col gap-2">
      {/* URL */}
      <div className="flex items-center gap-2">
        <FiGlobe className="text-blue-500" size={20} />
        <h3 className="font-bold text-lg break-all">{site.url}</h3>
      </div>

      {/* DATETIME */}
      <div className="flex items-center gap-2 text-gray-500">
        <FiCalendar size={16} />
        <p>
          Date & Time:{" "}
          <span className="font-medium text-gray-700">
            {formatWIB(site.datetime)}
          </span>
        </p>
      </div>

      {/* STATUS */}
      <div className="flex items-center gap-2 text-gray-500">
        <FiLock size={16} />
        <p className="text-green-600 font-semibold">Status: Deleted</p>
      </div>
    </div>
  );
}
