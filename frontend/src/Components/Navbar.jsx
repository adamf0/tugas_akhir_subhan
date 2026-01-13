import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded hover:bg-blue-100 transition ${
      isActive ? "bg-blue-500 text-white" : "text-gray-700"
    }`;

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">Sitemap Control</div>
      <div className="flex space-x-4">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/site" className={linkClass}>
          Site
        </NavLink>
        <NavLink to="/about" className={linkClass}>
          About
        </NavLink>
      </div>
    </nav>
  );
}
