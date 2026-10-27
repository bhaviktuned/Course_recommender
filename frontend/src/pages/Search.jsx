import { useEffect, useState } from "react";
import { api } from "../api";
import CourseCard from "../components/CourseCard";

export default function SearchPage({ q }) {
  const [results, setResults] = useState(null);

  useEffect(() => {
    setResults(null);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    api(`/api/search?q=${encodeURIComponent(q)}&limit=50`).then(setResults).catch(() => setResults([]));
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1f1f1f]">Results for “{q}”</h1>
      {results === null && <p className="mt-6 text-slate-500">Searching…</p>}
      {results && results.length === 0 && (
        <p className="mt-6 text-slate-600">
          No courses found. Try a shorter word, like “alg”, “web” or “learning”, or <a className="text-[#0056D2] underline" href="#/">browse all courses</a>.
        </p>
      )}
      {results && results.length > 0 && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
