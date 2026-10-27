import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">

      <div className="bg-white rounded-2xl p-10 text-center max-w-lg w-full shadow-lg">

        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center text-3xl">
          ✓
        </div>

        <h1 className="text-3xl font-bold mt-6">
          Payment Successful
        </h1>

        <p className="text-slate-600 mt-3">
          Your course has been added to your account.
        </p>

        <Link
          to="/dashboard"
          className="block bg-blue-600 text-white rounded-xl py-4 mt-7 font-semibold"
        >
          Go to Dashboard
        </Link>

      </div>

    </main>
  );
}