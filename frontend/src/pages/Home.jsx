import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CourseCard from "../components/CourseCard";
import SearchBox from "../components/SearchBox";
import { useApp } from "../context";
import { LEVEL_LABEL } from "../lib";

function Row({ title, subtitle, courses }) {
  if (!courses.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[#1f1f1f]">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((c) => <CourseCard key={c.id} course={c} />)}
      </div>
    </section>
  );
}

export default function Home({ params }) {
  const { courses, categories, byId, user, mine, catalogError } = useApp();
  const [next, setNext] = useState([]);
  const [recs, setRecs] = useState([]);
  const [level, setLevel] = useState("all");
  const cat = params.cat || "";

  const mineKey = useMemo(
    () => Object.entries(mine).map(([k, v]) => `${k}:${v}`).sort().join("|"),
    [mine]
  );
  const hasCourses = Object.keys(mine).length > 0;

  useEffect(() => {
    if (!user || !hasCourses) {
      setNext([]);
      setRecs([]);
      return;
    }
    api("/api/me/next?k=4").then(setNext).catch(() => setNext([]));
    api("/api/me/recommendations?k=4").then(setRecs).catch(() => setRecs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mineKey]);

  useEffect(() => {
    if (cat) document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  }, [cat]);

  const starters = courses.filter((c) => c.level === "beginner").slice(0, 4);
  const filtered = courses.filter((c) => (!cat || c.category === cat) && (level === "all" || c.level === level));
  const full = (list) => list.map((c) => byId[c.id]).filter(Boolean);

  return (
    <div>
      <section style={{ background: "linear-gradient(#eaf1ff, #ffffff)" }}>
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-3xl font-bold text-[#0f1e3d] sm:text-5xl">Learn without limits</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Find the right course, see exactly what to take first, and keep track of your progress.
          </p>
          <div className="mx-auto mt-7 max-w-2xl">
            <SearchBox large />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {catalogError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{catalogError}</div>
        )}

        {user && hasCourses ? (
          <>
            <Row title="Ready for you next" subtitle="You've finished the prerequisites for these" courses={full(next)} />
            <Row title="Recommended for you" subtitle="Based on the courses you've saved or completed" courses={full(recs)} />
          </>
        ) : (
          <Row title="Popular ways to start" subtitle="Beginner-friendly courses with no prerequisites" courses={starters} />
        )}

        <section id="explore" className="mt-12 scroll-mt-20">
          <h2 className="text-xl font-bold text-[#1f1f1f]">Explore all courses</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href="#/" className={`rounded-full border px-4 py-1.5 text-sm ${!cat ? "border-[#0056D2] bg-[#0056D2] text-white" : "border-slate-300 text-slate-700 hover:border-slate-400"}`}>
              All
            </a>
            {categories.map((c) => (
              <a key={c} href={`#/?cat=${encodeURIComponent(c)}`}
                className={`rounded-full border px-4 py-1.5 text-sm ${cat === c ? "border-[#0056D2] bg-[#0056D2] text-white" : "border-slate-300 text-slate-700 hover:border-slate-400"}`}>
                {c}
              </a>
            ))}
            <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level"
              className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
              <option value="all">All levels</option>
              {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
          {filtered.length === 0 && !catalogError && <p className="mt-6 text-slate-500">No courses match these filters.</p>}
        </section>
      </div>
    </div>
  );
}
