import { useApp } from "../context";
import { MenuIcon } from "./Icons";
import SearchBox from "./SearchBox";

export default function Navbar({ onMenu }) {
  const { user } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <button onClick={onMenu} aria-label="Open menu" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100">
          <MenuIcon />
        </button>
        <a href="#/" className="flex items-center gap-2 text-xl font-bold text-[#0056D2]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0056D2] text-sm text-white">C</span>
          CourseMap
        </a>
        <div className="mx-4 hidden max-w-xl flex-1 sm:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <a
              href="#/profile"
              aria-label="Your profile"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#0056D2] text-sm font-semibold text-white"
            >
              {user.name.trim().charAt(0).toUpperCase()}
            </a>
          ) : (
            <>
              <a href="#/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#0056D2] hover:bg-[#f5f8ff] sm:block">
                Log in
              </a>
              <a href="#/signup" className="rounded-lg bg-[#0056D2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e]">
                Join for free
              </a>
            </>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
