import { useState } from "react";
import { useApp } from "../context";
import { go } from "../router";

export default function Auth({ mode }) {
  const { login, signup, user } = useApp();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">You're logged in as {user.name}</h1>
        <a href="#/" className="mt-6 inline-block rounded-lg bg-[#0056D2] px-6 py-2.5 font-semibold text-white">Go to home</a>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isSignup) await signup(name, email, password);
      else await login(email, password);
      go("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#1f1f1f]">{isSignup ? "Join for free" : "Welcome back"}</h1>
        <p className="text-sm text-slate-500">
          {isSignup ? "Create an account to save courses and track your progress." : "Log in to see your saved courses and progress."}
        </p>

        {isSignup && (
          <label className="block text-sm">
            <span className="text-slate-700">Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} required className={input} />
          </label>
        )}
        <label className="block text-sm">
          <span className="text-slate-700">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={input} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 8 : undefined} required className={input} />
          {isSignup && <span className="mt-1 block text-xs text-slate-500">At least 8 characters.</span>}
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[#c5221f]">{error}</p>}

        <button disabled={busy} className="w-full rounded-lg bg-[#0056D2] py-2.5 font-semibold text-white hover:bg-[#00419e] disabled:opacity-60">
          {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
        </button>

        <p className="text-center text-sm text-slate-600">
          {isSignup ? (
            <>Already have an account? <a href="#/login" className="font-semibold text-[#0056D2]">Log in</a></>
          ) : (
            <>New here? <a href="#/signup" className="font-semibold text-[#0056D2]">Join for free</a></>
          )}
        </p>
      </form>
    </div>
  );
}
