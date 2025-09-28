import { NavLink } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4">
      <div className="text-center p-8 rounded-lg shadow-lg bg-card">
        <h1 className="text-6xl font-bold mb-4" style={{ color: "#9B36FF" }}>
          404
        </h1>
        <p className="text-xl text-gray-700 mb-2">Page not found</p>
        <p className="text-gray-500 mb-6">
          Sorry, the page you’re looking for doesn’t exist.
        </p>
        <NavLink
          to="/"
          className="rounded-lg px-6 py-2 text-white shadow-md transition"
          style={{ backgroundColor: "#9B36FF" }}
        >
          Go Home
        </NavLink>
      </div>
    </div>
  );
}
