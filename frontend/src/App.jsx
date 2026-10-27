import { useCallback, useEffect, useState } from "react";
import Drawer from "./components/Drawer";
import Navbar from "./components/Navbar";
import { AppProvider, useApp } from "./context";
import Auth from "./pages/Auth";
import CoursePage from "./pages/Course";
import Home from "./pages/Home";
import MyLearning from "./pages/MyLearning";
import Profile from "./pages/Profile";
import SearchPage from "./pages/Search";
import { useRoute } from "./router";

function Shell() {
  const { authReady } = useApp();
  const { path, params } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => { closeMenu(); }, [path, closeMenu]);

  let page;
  if (!authReady) page = <p className="py-24 text-center text-slate-500">Loading…</p>;
  else if (path === "/") page = <Home params={params} />;
  else if (path.startsWith("/course/")) page = <CoursePage id={decodeURIComponent(path.slice(8))} />;
  else if (path === "/search") page = <SearchPage q={params.q || ""} />;
  else if (path === "/learning") page = <MyLearning />;
  else if (path === "/profile") page = <Profile />;
  else if (path === "/login") page = <Auth mode="login" />;
  else if (path === "/signup") page = <Auth mode="signup" />;
  else page = (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <a href="#/" className="mt-4 inline-block text-[#0056D2] underline">Go home</a>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1f1f1f]">
      <Navbar onMenu={() => setMenuOpen(true)} />
      <Drawer open={menuOpen} onClose={closeMenu} />
      <main className="flex-1">{page}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Courses are offered by their universities and platforms. Links open the original course pages.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
