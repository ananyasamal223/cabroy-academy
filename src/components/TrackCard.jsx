export default function TrackCard({
  title,
  description,
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-8 bg-white hover:shadow-lg">

      <div className="w-12 h-12 bg-blue-50 rounded-xl mb-6" />

      <h3 className="text-xl font-bold">
        {title}
      </h3>

      <p className="text-slate-600 mt-3 leading-7">
        {description}
      </p>

      <button className="text-blue-600 font-semibold mt-6">
        Explore Track →
      </button>

    </div>
  );
}