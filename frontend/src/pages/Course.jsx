import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CourseCard from "../components/CourseCard";
import { BookmarkIcon, CheckIcon, ExternalIcon } from "../components/Icons";
import LevelBadge from "../components/LevelBadge";
import PathGraph from "../components/PathGraph";
import { useApp } from "../context";
import { catStyle, hostOf } from "../lib";
import { go } from "../router";

export default function CoursePage({ id }) {
  const { byId, courses, user, mine, setStatus, removeCourse } = useApp();
  const course = byId[id];
  const exists = Boolean(course);
  const [steps, setSteps] = useState(null);
  const [edges, setEdges] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [busy, setBusy] = useState(false);

  const completedKey = useMemo(
    () => Object.entries(mine).filter(([, s]) => s === "completed").map(([k]) => k).sort().join(","),
    [mine]
  );

  useEffect(() => {
    api("/api/graph").then((g) => setEdges(g.prerequisites)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!exists) return;
    setSteps(null);
    api(`/api/path/${id}?completed=${completedKey}`).then(setSteps).catch(() => setSteps([]));
  }, [id, exists, completedKey]);

  useEffect(() => {
    if (!exists) return;
    api(`/api/recommend?liked=${id}&k=4`).then(setSimilar).catch(() => setSimilar([]));
  }, [id, exists]);

  if (!exists) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{courses.length === 0 ? "Loading…" : "Course not found"}</h1>
        {courses.length > 0 && <a href="#/" className="mt-4 inline-block text-[#0056D2] underline">Back to all courses</a>}
      </div>
    );
  }

  const status = mine[id];
  const act = async (fn) => {
    if (!user) return go("/login");
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };
  const toggleSaved = () => act(() => (status === "saved" ? removeCourse(id) : setStatus(id, "saved")));
  const toggleDone = () => act(() => (status === "completed" ? removeCourse(id) : setStatus(id, "completed")));

  const prereqSteps = steps ? steps.slice(0, -1) : [];
  const hasPrereqs = course.prerequisites.length > 0;

  return (
    <div>
      <section style={catStyle(course.category)} className="text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <a href={`#/?cat=${encodeURIComponent(course.category)}`} className="text-sm text-white/80 hover:underline">{course.category}</a>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold sm:text-4xl">{course.title}</h1>
          <p className="mt-2 text-white/90">{course.provider}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href={course.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-[#0056D2] hover:bg-slate-100">
              Go to course <ExternalIcon />
            </a>
            <button disabled={busy || status === "completed"} onClick={toggleSaved}
              className="inline-flex items-center gap-2 rounded-lg border border-white/70 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50">
              <BookmarkIcon filled={status === "saved"} /> {status === "saved" ? "Saved" : "Save for later"}
            </button>
            <button disabled={busy} onClick={toggleDone}
              className="inline-flex items-center gap-2 rounded-lg border border-white/70 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50">
              <CheckIcon /> {status === "completed" ? "Completed" : "Mark as completed"}
            </button>
          </div>
          <p className="mt-3 text-xs text-white/70">Opens on {hostOf(course.url)}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[#1f1f1f]">About this course</h2>
            <p className="mt-3 leading-relaxed text-slate-700">{course.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.tags.map((t) => (
                <span key={t} className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-medium text-[#0056D2]">{t}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-[#1f1f1f]">Course details</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div><dt className="text-slate-500">Level</dt><dd className="mt-0.5"><LevelBadge level={course.level} /></dd></div>
              <div><dt className="text-slate-500">Offered by</dt><dd className="mt-0.5 text-[#1f1f1f]">{course.provider}</dd></div>
              <div>
                <dt className="text-slate-500">Prerequisites</dt>
                <dd className="mt-0.5 text-[#1f1f1f]">
                  {hasPrereqs
                    ? course.prerequisites.map((p) => byId[p]?.title).filter(Boolean).join(", ")
                    : "None. You can start right away."}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {steps && steps.length > 1 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-[#1f1f1f]">Your path to this course</h2>
            <p className="mt-1 text-sm text-slate-500">
              Take these in order. Courses you've marked as completed are skipped. Click any box to open it.
            </p>
            <div className="mt-4"><PathGraph steps={steps} edges={edges} currentId={id} /></div>
            <ol className="mt-4 space-y-2">
              {steps.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eaf1ff] text-sm font-semibold text-[#0056D2]">{s.step}</span>
                  <a href={`#/course/${s.id}`} className="font-medium text-[#1f1f1f] hover:text-[#0056D2]">{s.title}</a>
                  <span className="ml-auto hidden text-sm text-slate-500 sm:block">{s.provider}</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.title}`} className="text-slate-400 hover:text-[#0056D2]">
                    <ExternalIcon />
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}
        {steps && steps.length === 1 && hasPrereqs && prereqSteps.length === 0 && (
          <p className="mt-10 rounded-lg bg-[#e6f4ea] p-4 text-sm text-[#1e6b34]">
            You've completed every prerequisite for this course. You're ready to start.
          </p>
        )}

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-[#1f1f1f]">Learners also explore</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((c) => byId[c.id] && <CourseCard key={c.id} course={byId[c.id]} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
