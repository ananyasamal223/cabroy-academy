import { Link } from "react-router-dom";
import { Clock, Star, Users } from "lucide-react";

export default function CourseCard({ course }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl">

      <div className="h-48 bg-gradient-to-br from-slate-950 to-blue-600 flex items-center justify-center">
        <span className="text-white font-semibold text-lg">
          {course.category}
        </span>
      </div>

      <div className="p-6">

        <span className="text-blue-600 text-sm font-semibold">
          {course.category}
        </span>

        <h3 className="text-xl font-bold mt-2">
          {course.title}
        </h3>

        <p className="text-slate-600 mt-3 leading-6">
          {course.description}
        </p>

        <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-500">

          <span className="flex gap-1 items-center">
            <Clock size={16} />
            {course.duration}
          </span>

          <span className="flex gap-1 items-center">
            <Star size={16} />
            {course.rating}
          </span>

          <span className="flex gap-1 items-center">
            <Users size={16} />
            {course.students}
          </span>

        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {course.skills?.map((skill) => (
            <span
              key={skill}
              className="bg-slate-100 px-3 py-1 rounded-lg text-xs"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">

          <div>
            <span className="text-xl font-bold">
              ₹{course.price}
            </span>

            <span className="text-slate-400 line-through ml-2">
              ₹{course.originalPrice}
            </span>
          </div>

          <Link
            to={`/courses/${course.id}`}
            className="text-blue-600 font-semibold"
          >
            View Course →
          </Link>

        </div>

      </div>

    </div>
  );
}