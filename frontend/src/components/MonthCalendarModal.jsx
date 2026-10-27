import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Video, Check } from "lucide-react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Builds a Mon-start 6-week grid, including the trailing/leading days
// from the adjacent months so every row has 7 cells.
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

// courses: [{ courseId, courseTitle, limit, used, remaining }]
export default function MonthCalendarModal({
  open,
  onClose,
  onBookSession, // async (date, courseId) => void — throw to signal an error
  busyDates = [],
  courses = [],
  initialDate = null,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(new Date(today));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  // When opened via a quick-pick day in the dashboard, start on that date.
  useEffect(() => {
    if (open && initialDate) {
      setSelectedDate(initialDate);
      setViewDate(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    }
    if (open && !selectedCourseId && courses.length > 0) {
      setSelectedCourseId(String(courses[0].courseId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = buildMonthGrid(year, month);

  const selectedCourse = courses.find((c) => String(c.courseId) === selectedCourseId);
  const noCoursesEnrolled = courses.length === 0;
  const outOfSessions = selectedCourse && selectedCourse.remaining <= 0;

  const goToMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedCourseId || outOfSessions) return;
    setError("");
    setBooking(true);
    try {
      await onBookSession?.(selectedDate, selectedCourseId);
      setBooked(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not book this session. Try another date.");
    } finally {
      setBooking(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedCourseId("");
    setBooked(false);
    setError("");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[380px] rounded-[20px] bg-white p-5 shadow-[0_25px_70px_rgba(15,23,42,.25)]">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#172033]">
              Book a Mentor Session
            </h3>
            <p className="mt-0.5 text-[10px] text-[#8a94a8]">
              Pick a course and a date based on your availability.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#98a2b3] transition hover:bg-[#f3f5f8]"
          >
            <X size={16} />
          </button>
        </div>

        {noCoursesEnrolled ? (
          <div className="mt-6 rounded-[12px] bg-[#f8faff] px-4 py-6 text-center">
            <p className="text-[11px] leading-5 text-[#657087]">
              Mentor sessions are available once you're enrolled in a course.
              Enroll in a course to start booking sessions.
            </p>
          </div>
        ) : !booked ? (
          <>
            {/* COURSE PICKER */}
            <div className="mt-5">
              <label className="text-[9px] font-semibold text-[#536078]">
                Course
              </label>

              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[11px] font-medium text-[#344054] outline-none focus:border-[#2563eb]"
              >
                {courses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.courseTitle}
                  </option>
                ))}
              </select>

              {selectedCourse && (
                <p
                  className={`mt-2 text-[10px] font-semibold ${
                    outOfSessions ? "text-[#e7606c]" : "text-[#16a674]"
                  }`}
                >
                  {outOfSessions
                    ? "No sessions left this month for this course"
                    : `${selectedCourse.remaining} of ${selectedCourse.limit} sessions left this month`}
                </p>
              )}
            </div>

            {/* MONTH NAVIGATION */}
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#e6eaf2] text-[#48556d] transition hover:bg-[#f8faff]"
              >
                <ChevronLeft size={15} />
              </button>

              <p className="text-[12px] font-bold text-[#172033]">
                {MONTH_NAMES[month]} {year}
              </p>

              <button
                type="button"
                onClick={() => goToMonth(1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#e6eaf2] text-[#48556d] transition hover:bg-[#f8faff]"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* WEEKDAY LABELS */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-[9px] font-semibold text-[#8a94a8]">
                  {day}
                </div>
              ))}
            </div>

            {/* DATE GRID */}
            <div className="mt-1 grid grid-cols-7 gap-1">
              {grid.map((date) => {
                const inCurrentMonth = date.getMonth() === month;
                const isPast = date < today;
                const isToday = isSameDay(date, today);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isBusy = busyDates.includes(toDateKey(date));
                const disabled = isPast || !inCurrentMonth;

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedDate(date)}
                    className={`relative grid h-9 place-items-center rounded-[8px] text-[11px] font-semibold transition ${
                      isSelected
                        ? "bg-[#2563eb] text-white"
                        : disabled
                        ? "text-[#c7cdda]"
                        : isToday
                        ? "border border-[#2563eb] text-[#2563eb]"
                        : "text-[#344054] hover:bg-[#f3f7ff]"
                    }`}
                  >
                    {date.getDate()}
                    {isBusy && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#e7606c]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* BOOK BUTTON */}
            <button
              type="button"
              disabled={!selectedDate || booking || outOfSessions}
              onClick={handleBook}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#2563eb] text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Video size={15} />
              {booking
                ? "Booking..."
                : outOfSessions
                ? "No sessions left"
                : selectedDate
                ? `Book Session — ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Select a date to book"}
            </button>

            {error && (
              <p className="mt-3 text-center text-[10px] font-medium text-red-600">
                {error}
              </p>
            )}
          </>
        ) : (
          // CONFIRMATION
          <div className="mt-6 flex flex-col items-center py-4 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#eafaf4]">
              <Check size={26} className="text-[#16a674]" strokeWidth={3} />
            </div>

            <p className="mt-4 text-[13px] font-bold text-[#172033]">
              Session Requested
            </p>

            <p className="mt-1.5 max-w-[260px] text-[11px] leading-5 text-[#8a94a8]">
              A mentor will confirm your{" "}
              {selectedCourse?.courseTitle || "course"} session on{" "}
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              shortly.
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-5 h-10 rounded-[9px] border border-[#dfe4ec] px-5 text-[11px] font-semibold text-[#536078] transition hover:bg-[#f8faff]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
