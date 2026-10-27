import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  MonitorCheck,
  Pencil,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  UsersRound,
  X,
} from "lucide-react";
import api from "../api/client";

const LIKE_OPTIONS = [
  { value: "Content Quality", icon: ThumbsUp },
  { value: "Mentor Support", icon: UsersRound },
  { value: "Assignments", icon: ClipboardList },
  { value: "Platform Experience", icon: MonitorCheck },
];

function StarRating({ value, onChange, readonly = false, size = 34 }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value || 0;

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= shown;

        if (readonly) {
          return (
            <Star
              key={star}
              size={size}
              strokeWidth={1.8}
              className={active ? "fill-[#ffb51f] text-[#ffb51f]" : "text-[#d9e0ea]"}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="rounded-md transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <Star
              size={size}
              strokeWidth={1.8}
              className={active ? "fill-[#ffb51f] text-[#ffb51f]" : "text-[#ffb51f]"}
            />
          </button>
        );
      })}
    </div>
  );
}

function FeedbackForm({ courseId, existingFeedback, onSaved, onCancel, showSkip = false }) {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [liked, setLiked] = useState(existingFeedback?.liked || []);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleLiked(value) {
    setLiked((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  async function handleSubmit() {
    setError("");

    if (!rating) {
      setError("Please select your rating.");
      return;
    }

    const cleanComment = comment.trim();
    if (!cleanComment) {
      setError("Please write your feedback.");
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.put(`/feedback/course/${courseId}`, {
        rating,
        liked,
        comment: cleanComment,
      });
      onSaved?.(data.feedback);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-7 lg:grid-cols-[315px_minmax(0,1fr)]">
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[#2d3852]">Your Rating</p>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="mt-2 text-[11px] font-medium text-[#7f8ba0]">{rating} out of 5</p>
          )}
        </div>

        <div>
          <p className="mb-3 text-[13px] font-semibold text-[#2d3852]">
            What did you like? <span className="font-normal text-[#7d879a]">(Select all that apply)</span>
          </p>

          <div className="flex flex-wrap gap-2.5">
            {LIKE_OPTIONS.map(({ value, icon: Icon }) => {
              const selected = liked.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleLiked(value)}
                  className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-5 text-[12px] font-semibold transition ${
                    selected
                      ? "border-[#2584e9] bg-[#eef6ff] text-[#176fdc]"
                      : "border-[#dce4ef] bg-white text-[#46536b] hover:border-[#b7d1f2] hover:bg-[#f9fbff]"
                  }`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-3 block text-[13px] font-semibold text-[#2d3852]">Your Feedback</label>
        <div className="relative">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            placeholder="Write your feedback here..."
            className="min-h-[118px] w-full resize-none rounded-[11px] border border-[#dce5ef] bg-white px-4 py-3.5 pr-16 text-[12px] leading-6 text-[#263249] outline-none transition placeholder:text-[#a4aebe] focus:border-[#3188eb] focus:ring-2 focus:ring-[#ddecff]"
          />
          <span className="absolute bottom-3 right-4 text-[10px] text-[#8793a6]">{comment.length}/500</span>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-[9px] border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="inline-flex h-12 min-w-[210px] items-center justify-center gap-2 rounded-[9px] bg-gradient-to-r from-[#168fe9] to-[#1877df] px-6 text-[12px] font-bold text-white shadow-[0_7px_18px_rgba(27,119,222,.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {existingFeedback ? "Update Feedback" : "Submit Feedback"}
          </button>

          {showSkip && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[12px] font-semibold text-[#176fdc] transition hover:underline"
            >
              Skip for now
            </button>
          )}

          {existingFeedback && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[12px] font-semibold text-[#657187] transition hover:text-[#263249]"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex max-w-[555px] items-start gap-3 rounded-[10px] bg-[#ecfaf5] px-5 py-3.5 text-[#4d6a61]">
          <div className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#289d79] text-[10px] font-bold text-[#289d79]">
            i
          </div>
          <p className="text-[11px] font-medium leading-5">
            Your feedback will be visible to the Rathi Academy admin team only.
            <br />
            Thank you for helping us improve!
          </p>
        </div>
      </div>
    </>
  );
}

function SubmittedFeedback({ feedback, onEdit }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-[#e8f3ed] bg-[#f7fcf9] px-6 py-9 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[#dff7ea] text-[#18a568]">
        <CheckCircle2 size={30} strokeWidth={2} />
      </div>

      <h3 className="mt-4 text-[17px] font-bold text-[#16213a]">Thank You for Your Feedback!</h3>
      <p className="mt-1.5 text-[11px] leading-5 text-[#7d899d]">
        Your feedback has been submitted successfully.
        <br />
        It helps us improve and create a better learning experience.
      </p>

      <div className="mt-3">
        <StarRating value={feedback?.rating || 0} readonly size={19} />
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#cadef8] bg-white px-5 text-[11px] font-semibold text-[#176fdc] transition hover:bg-[#f6faff]"
      >
        <Pencil size={14} />
        View / Edit Feedback
      </button>
    </div>
  );
}

export function CourseFeedbackPanel({ courseId, courseTitle }) {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [editing, setEditing] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback() {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get(`/feedback/course/${courseId}/me`);
        if (!cancelled) setFeedback(data.feedback || null);
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status !== 404) console.error("Could not load feedback", err);
          setFeedback(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (hidden) {
    return (
      <div className="mt-10 flex justify-end">
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#d5e2f3] bg-white px-4 text-[11px] font-semibold text-[#176fdc] transition hover:bg-[#f7faff]"
        >
          <Star size={15} />
          Give Feedback
        </button>
      </div>
    );
  }

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-[#dce5ef] bg-white shadow-sm">
      <div className="flex items-start justify-between px-6 pb-2 pt-6 md:px-7">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf3ff] text-[#126fe5]">
            <Star size={24} className="fill-[#126fe5] text-[#126fe5]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold text-[#101a37]">Share Your Course Feedback</h2>
            <p className="mt-1 text-[11px] leading-5 text-[#8390a4]">
              Tell us about your learning experience. Your feedback helps us improve {courseTitle || "this course"}.
            </p>
          </div>
        </div>

        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e4eaf2] bg-white text-[#1177e6]">
          <Sparkles size={18} />
        </div>
      </div>

      <div className="px-6 pb-7 pt-5 md:px-7">
        {loading ? (
          <div className="flex h-[170px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#1879e6]" />
          </div>
        ) : feedback && !editing ? (
          <SubmittedFeedback feedback={feedback} onEdit={() => setEditing(true)} />
        ) : (
          <FeedbackForm
            courseId={courseId}
            existingFeedback={feedback}
            showSkip={!feedback}
            onCancel={() => {
              if (feedback) setEditing(false);
              else setHidden(true);
            }}
            onSaved={(saved) => {
              setFeedback(saved);
              setEditing(false);
            }}
          />
        )}
      </div>
    </section>
  );
}

export function CourseFeedbackButton({ courseId, courseTitle, className = "" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback() {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get(`/feedback/course/${courseId}/me`);
        if (!cancelled) setFeedback(data.feedback || null);
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status !== 404) console.error("Could not load feedback", err);
          setFeedback(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <>
      <button
        type="button"
        disabled={loading || !courseId}
        onClick={() => setOpen(true)}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border px-4 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          feedback
            ? "border-[#ccebd9] bg-[#f0fbf5] text-[#168f59] hover:bg-[#e7f8ef]"
            : "border-[#d6e3f4] bg-white text-[#176fdc] hover:bg-[#f5f9ff]"
        } ${className}`}
      >
        {feedback ? <Pencil size={15} /> : <Star size={15} />}
        {loading ? "Checking..." : feedback ? "View / Edit Feedback" : "Give Feedback"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07142c]/45 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-[1040px] overflow-y-auto rounded-[20px] bg-white shadow-[0_25px_80px_rgba(0,0,0,.22)]">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#edf1f6] bg-white px-6 py-5 md:px-7">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf3ff] text-[#1472e5]">
                  <Star size={23} className="fill-[#1472e5] text-[#1472e5]" />
                </div>
                <div>
                  <h2 className="text-[19px] font-bold text-[#101a37]">Share Your Course Feedback</h2>
                  <p className="mt-1 text-[11px] text-[#8490a3]">{courseTitle || "Your course"}</p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close feedback"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#66748b] transition hover:bg-[#f3f6fa]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6 md:p-7">
              <FeedbackForm
                courseId={courseId}
                existingFeedback={feedback}
                onCancel={() => setOpen(false)}
                onSaved={(saved) => {
                  setFeedback(saved);
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
