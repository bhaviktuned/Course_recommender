const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

let token = localStorage.getItem("token");
export const getToken = () => token;
export const setToken = (t) => {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Can't reach the server. Please try again.");
  }
  if (!res.ok) {
    let message = `Something went wrong (${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return res.json();
}
