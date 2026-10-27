export const CATEGORY_COLORS = {
  "Computer Science": ["#0a3d91", "#2f80ed"],
  "Web Development": ["#0f766e", "#2dd4bf"],
  "Math & Statistics": ["#9a3412", "#fb923c"],
  "Machine Learning & AI": ["#5b21b6", "#a78bfa"],
  "Data & Databases": ["#166534", "#4ade80"],
  "Security & Networking": ["#9d174d", "#f472b6"],
};

export const catStyle = (category) => {
  const [a, b] = CATEGORY_COLORS[category] || ["#1f2937", "#6b7280"];
  return { background: `linear-gradient(135deg, ${a}, ${b})` };
};

export const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const LEVEL_COLOR = { beginner: "#1e8e3e", intermediate: "#e37400", advanced: "#c5221f" };

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const BLUE = "#0056D2";
