import { useEffect } from "react";
import { useApp } from "../context";
import { go } from "../router";
import { CloseIcon } from "./Icons";

export default function Drawer({ open, onClose }) {
  const { user, logout, categories, mine } = useApp();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const item = "flex items-center justify-between px-5 py-3 text-[15px] text-[#1f1f1f] hover:bg-[#f5f8ff]";
  const total = Object.keys(mine).length;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        className={`absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <span className="text-lg font-bold text-[#0056D2]">CourseMap</span>
          <button onClick={onClose} aria-label="Close menu" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" onClick={onClose}>
          {user ? (
            <a href="#/profile" className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 hover:bg-[#f5f8ff]">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0056D2] font-semibold text-white">
                {user.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-[#1f1f1f]">{user.name}</span>
                <span className="block truncate text-sm text-slate-500">{user.email}</span>
              </span>
            </a>
          ) : (
            <div className="space-y-2 border-b border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-600">Log in to save courses and track your progress.</p>
              <a href="#/login" className="block rounded-lg border border-[#0056D2] py-2 text-center text-sm font-semibold text-[#0056D2]">
                Log in
              </a>
              <a href="#/signup" className="block rounded-lg bg-[#0056D2] py-2 text-center text-sm font-semibold text-white">
                Join for free
              </a>
            </div>
          )}

          <nav className="py-2">
            <a href="#/" className={item}>Home</a>
            {user && (
              <>
                <a href="#/learning" className={item}>
                  My Learning
                  {total > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{total}</span>}
                </a>
                <a href="#/profile" className={item}>Profile</a>
              </>
            )}
          </nav>

          <div className="border-t border-slate-200 py-2">
            <p className="px-5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Browse by topic</p>
            {categories.map((c) => (
              <a key={c} href={`#/?cat=${encodeURIComponent(c)}`} className={item}>{c}</a>
            ))}
          </div>
        </div>

        {user && (
          <div className="border-t border-slate-200 p-3">
            <button
              onClick={async () => { await logout(); onClose(); go("/"); }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-[#c5221f] hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
