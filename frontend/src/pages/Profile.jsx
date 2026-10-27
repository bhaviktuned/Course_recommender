import { useEffect, useState } from "react";
import { useApp } from "../context";
import { go } from "../router";

export default function Profile() {
  const { user, mine, renameUser, logout, courses } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => setName(user?.name || ""), [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="mt-2 text-slate-600">Log in to see your profile.</p>
        <a href="#/login" className="mt-6 inline-block rounded-lg bg-[#0056D2] px-6 py-2.5 font-semibold text-white">Log in</a>
      </div>
    );
  }

  const completed = Object.values(mine).filter((s) => s === "completed").length;
  const saved = Object.values(mine).filter((s) => s === "saved").length;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await renameUser(name);
      setMsg({ type: "ok", text: "Saved." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-16">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#0056D2] text-2xl font-semibold text-white">
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[#1f1f1f]">{user.name}</h1>
          <p className="text-slate-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {[["Completed", completed], ["Saved", saved], ["Courses available", courses.length]].map(([label, n]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-[#0056D2]">{n}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="mt-8 space-y-4 rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-[#1f1f1f]">Account details</h2>
        <label className="block text-sm">
          <span className="text-slate-600">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#0056D2]" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Email</span>
          <input value={user.email} disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500" />
        </label>
        <p className="text-sm text-slate-500">Member since {new Date(user.created_at * 1000).toLocaleDateString()}</p>
        {msg.text && <p className={`text-sm ${msg.type === "ok" ? "text-[#1e8e3e]" : "text-[#c5221f]"}`}>{msg.text}</p>}
        <button disabled={busy} className="rounded-lg bg-[#0056D2] px-5 py-2 font-semibold text-white hover:bg-[#00419e] disabled:opacity-60">
          Save changes
        </button>
      </form>

      <button onClick={async () => { await logout(); go("/"); }}
        className="mt-6 rounded-lg border border-slate-300 px-5 py-2 font-medium text-[#c5221f] hover:bg-red-50">
        Log out
      </button>
    </div>
  );
}
