import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">

      <div>

        <span className="inline-block bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold">
          Build Real Skills. Create Real Impact.
        </span>

        <h1 className="text-5xl lg:text-6xl font-bold text-slate-950 leading-tight mt-6">
          Master Digital Skills.
          <span className="block text-blue-600">
            Build. Grow. Impact.
          </span>
        </h1>

        <p className="text-lg text-slate-600 leading-8 mt-6 max-w-xl">
          Learn practical skills in digital marketing,
          data analytics and AI automation through
          guided modules, live mentor sessions and
          real-world projects.
        </p>

        <div className="flex flex-wrap gap-4 mt-8">

          <Link
            to="/courses"
            className="bg-blue-600 text-white px-7 py-4 rounded-xl font-semibold"
          >
            Explore Courses →
          </Link>

          <button className="border border-slate-300 px-7 py-4 rounded-xl font-semibold flex items-center gap-2">
            <PlayCircle size={20} />
            Watch Intro
          </button>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">

          <div>
            <p className="text-2xl font-bold">20+</p>
            <p className="text-sm text-slate-500">
              Courses
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold">50K+</p>
            <p className="text-sm text-slate-500">
              Learners
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold">4.8/5</p>
            <p className="text-sm text-slate-500">
              Rating
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold">100%</p>
            <p className="text-sm text-slate-500">
              Practical
            </p>
          </div>

        </div>

      </div>

      <div className="bg-slate-950 rounded-[36px] min-h-[480px] flex items-center justify-center">

        <div className="text-center">

          <div className="w-36 h-36 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto">
            <span className="text-5xl text-white font-bold">
              RA
            </span>
          </div>

          <p className="text-white text-xl font-semibold mt-8">
            Learn. Build. Grow.
          </p>

          <p className="text-slate-400 mt-2">
            Skills designed for real-world impact.
          </p>

        </div>

      </div>

    </section>
  );
}