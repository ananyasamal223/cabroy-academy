import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-blue-600">
          404
        </h1>

        <h2 className="text-3xl font-bold mt-5">
          Page Not Found
        </h2>

        <p className="text-slate-500 mt-3">
          The page you're looking for doesn't exist.
        </p>

        <Link
          to="/"
          className="inline-block mt-7 bg-blue-600 text-white px-7 py-4 rounded-xl font-semibold"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}