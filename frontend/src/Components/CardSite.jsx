import { FiGlobe, FiLock } from "react-icons/fi";

export default function CardSite({ site, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer p-6 border rounded-lg shadow hover:shadow-lg bg-white transition flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <FiGlobe className="text-blue-500" size={20} />
        <h3 className="font-bold text-lg">{site.siteUrl}</h3>
      </div>
      <div className="flex items-center gap-2 text-gray-500">
        <FiLock size={16} />
        <p>Permission: {site.permissionLevel}</p>
      </div>
    </div>
  );
}
