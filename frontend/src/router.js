import { useEffect, useMemo, useState } from "react";

const rawHash = () => window.location.hash.replace(/^#/, "") || "/";

export function useRoute() {
  const [raw, setRaw] = useState(rawHash());
  useEffect(() => {
    const onChange = () => {
      setRaw(rawHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return useMemo(() => {
    const [path, query = ""] = raw.split("?");
    return { path: path || "/", params: Object.fromEntries(new URLSearchParams(query)) };
  }, [raw]);
}

export const go = (path) => {
  window.location.hash = path;
};
