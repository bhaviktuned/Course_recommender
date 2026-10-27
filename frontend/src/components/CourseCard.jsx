import { useApp } from "../context";
import { catStyle } from "../lib";
import { go } from "../router";
import { BookmarkIcon, CheckIcon } from "./Icons";
import LevelBadge from "./LevelBadge";

export default function CourseCard({ course }) {
  const { user, mine, setStatus, removeCourse } = useApp();
  const status = mine[course.id];

  const toggleSave = async () => {
    if (!user) return go("/login");
    if (status === "saved") await removeCourse(course.id);
    else await setStatus(course.id, "saved");
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-lg">
      <a href={`#/course/${course.id}`} className="block">
        <div style={catStyle(course.category)} className="flex h-24 items-end p-3">
          <span className="text-xs font-medium text-white/90">{course.provider}</span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug text-[#1f1f1f] group-hover:text-[#0056D2]">{course.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{course.category}</p>
          <div className="mt-3"><LevelBadge level={course.level} /></div>
        </div>
      </a>
      {status === "completed" ? (
        <span title="Completed" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-[#1e8e3e] shadow">
          <CheckIcon />
        </span>
      ) : (
        <button
          onClick={toggleSave}
          title={status === "saved" ? "Remove from saved" : "Save for later"}
          aria-label={status === "saved" ? "Remove from saved" : "Save for later"}
          className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow ${
            status === "saved" ? "text-[#0056D2]" : "text-slate-500 hover:text-[#0056D2]"
          }`}
        >
          <BookmarkIcon filled={status === "saved"} />
        </button>
      )}
    </div>
  );
}
