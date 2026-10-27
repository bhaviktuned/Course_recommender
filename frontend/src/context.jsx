import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const toMap = (list) => Object.fromEntries(list.map((c) => [c.id, c.status]));

export function AppProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mine, setMine] = useState({}); // courseId -> "saved" | "completed"

  useEffect(() => {
    api("/api/courses")
      .then(setCourses)
      .catch(() => setCatalogError("We can't reach the server right now. Please make sure the backend is running."));
  }, []);

  const loadMine = useCallback(async () => {
    setMine(toMap(await api("/api/me/courses")));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setAuthReady(true);
      return;
    }
    api("/api/me")
      .then(async (u) => {
        setUser(u);
        await loadMine();
      })
      .catch(() => setToken(null))
      .finally(() => setAuthReady(true));
  }, [loadMine]);

  const finishAuth = async (data) => {
    setToken(data.token);
    setUser(data.user);
    await loadMine();
  };

  const value = useMemo(() => {
    const byId = Object.fromEntries(courses.map((c) => [c.id, c]));
    const categories = [...new Set(courses.map((c) => c.category))].sort();
    return {
      courses,
      byId,
      categories,
      catalogError,
      user,
      authReady,
      mine,
      login: async (email, password) =>
        finishAuth(await api("/api/auth/login", { method: "POST", body: { email, password } })),
      signup: async (name, email, password) =>
        finishAuth(await api("/api/auth/signup", { method: "POST", body: { name, email, password } })),
      logout: async () => {
        try {
          await api("/api/auth/logout", { method: "POST" });
        } catch {
          /* ignore: we still clear the local session */
        }
        setToken(null);
        setUser(null);
        setMine({});
      },
      setStatus: async (id, status) =>
        setMine(toMap(await api(`/api/me/courses/${id}`, { method: "PUT", body: { status } }))),
      removeCourse: async (id) => setMine(toMap(await api(`/api/me/courses/${id}`, { method: "DELETE" }))),
      renameUser: async (name) => {
        const u = await api("/api/me", { method: "PATCH", body: { name } });
        setUser((prev) => ({ ...prev, ...u }));
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, catalogError, user, authReady, mine]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
