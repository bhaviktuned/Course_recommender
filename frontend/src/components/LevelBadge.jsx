import { LEVEL_COLOR, LEVEL_LABEL } from "../lib";

export default function LevelBadge({ level }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className="h-2 w-2 rounded-full" style={{ background: LEVEL_COLOR[level] }} />
      {LEVEL_LABEL[level]}
    </span>
  );
}
