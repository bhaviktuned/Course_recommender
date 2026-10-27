import { useEffect, useState } from "react";
import { api } from "../api";
import { go } from "../router";
import { SearchIcon } from "./Icons";

export default function SearchBox({ large = false, placeholder = "What do you want to learn?" }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    const t = setTimeout(() => {
      api(`/api/search?q=${encodeURIComponent(q)}&limit=6`).then(setItems).catch(() => setItems([]));
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    go(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form onSubmit={submit} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 focus-within:border-[#0056D2] focus-within:ring-2 focus-within:ring-[#0056D2]/20 ${
          large ? "h-14 text-base" : "h-11 text-sm"
        }`}
      >
        <span className="text-slate-400"><SearchIcon /></span>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          aria-label="Search courses"
          className="h-full w-full bg-transparent outline-none placeholder:text-slate-400"
        />
        {large && (
          <button type="submit" className="rounded-full bg-[#0056D2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#00419e]">
            Search
          </button>
        )}
      </div>
      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {items.map((c) => (
            <li key={c.id}>
              <a
                href={`#/course/${c.id}`}
                onClick={() => { setOpen(false); setQ(""); }}
                className="block px-4 py-2.5 hover:bg-[#f5f8ff]"
              >
                <div className="text-sm font-medium text-[#1f1f1f]">{c.title}</div>
                <div className="text-xs text-slate-500">{c.provider}</div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
