import { LEVEL_COLOR } from "../lib";

const FILL = { beginner: "#e6f4ea", intermediate: "#fef3e0", advanced: "#fce8e6" };

// Left-to-right drawing of the prerequisite DAG for one learning path.
export default function PathGraph({ steps, edges, currentId }) {
  const ids = new Set(steps.map((s) => s.id));
  const prereqs = Object.fromEntries(steps.map((s) => [s.id, []]));
  edges.forEach((e) => {
    if (ids.has(e.from) && ids.has(e.to)) prereqs[e.to].push(e.from);
  });
  const layer = {};
  steps.forEach((s) => {
    const p = prereqs[s.id];
    layer[s.id] = p.length ? 1 + Math.max(...p.map((x) => layer[x])) : 0; // steps arrive topologically sorted
  });
  const rows = {};
  const pos = {};
  const W = 210, H = 54, GX = 56, GY = 18;
  steps.forEach((s) => {
    const l = layer[s.id];
    const r = rows[l] ?? 0;
    rows[l] = r + 1;
    pos[s.id] = { x: l * (W + GX) + 4, y: r * (H + GY) + 4 };
  });
  const cols = Math.max(...Object.values(layer)) + 1;
  const maxRows = Math.max(...Object.values(rows));
  const width = cols * (W + GX) - GX + 8;
  const height = maxRows * (H + GY) - GY + 8;
  const short = (t) => (t.length > 28 ? t.slice(0, 27) + "…" : t);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-[#f5f8ff] p-4">
      <svg width={width} height={height}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#8a94a6" />
          </marker>
        </defs>
        {edges
          .filter((e) => ids.has(e.from) && ids.has(e.to))
          .map((e) => {
            const a = pos[e.from], b = pos[e.to];
            const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2;
            const mx = (x1 + x2) / 2;
            return (
              <path key={e.from + e.to} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none" stroke="#8a94a6" strokeWidth="1.5" markerEnd="url(#arrow)" />
            );
          })}
        {steps.map((s) => (
          <a key={s.id} href={`#/course/${s.id}`}>
            <g transform={`translate(${pos[s.id].x},${pos[s.id].y})`} style={{ cursor: "pointer" }}>
              <title>{s.title}</title>
              <rect width={W} height={H} rx="10" fill={FILL[s.level]}
                stroke={s.id === currentId ? "#0056D2" : LEVEL_COLOR[s.level]} strokeWidth={s.id === currentId ? 2.5 : 1} />
              <text x="12" y="23" fontSize="12.5" fill="#1f1f1f" fontWeight="600">{short(s.title)}</text>
              <text x="12" y="40" fontSize="11" fill="#5b6780">Step {s.step}</text>
            </g>
          </a>
        ))}
      </svg>
    </div>
  );
}
