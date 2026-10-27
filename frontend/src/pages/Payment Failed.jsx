import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function PaymentFailed() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-lg">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <X size={32} />
        </div>

        <h1 className="mt-6 text-3xl font-bold">
          Payment Failed
        </h1>

        <p className="mt-3 text-slate-600">
          We couldn't complete your payment.
          Please try again.
        </p>

        <Link
          to="/courses"
          className="mt-7 block rounded-xl bg-blue-600 py-4 font-semibold text-white"
        >
          Try Again
        </Link>

        <Link
          to="/"
          className="mt-4 block font-semibold text-slate-600"
        >
          Back to Home
        </Link>

      </div>
    </main>
  );
}