import CourseCard from "../components/CourseCard";
import { useApp } from "../context";

function Grid({ title, ids, byId }) {
  if (!ids.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-[#1f1f1f]">{title} <span className="text-base font-normal text-slate-500">({ids.length})</span></h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ids.map((id) => byId[id] && <CourseCard key={id} course={byId[id]} />)}
      </div>
    </section>
  );
}

export default function MyLearning() {
  const { user, mine, byId, courses } = useApp();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Track your learning</h1>
        <p className="mt-2 text-slate-600">Log in to save courses and mark the ones you've finished.</p>
        <a href="#/login" className="mt-6 inline-block rounded-lg bg-[#0056D2] px-6 py-2.5 font-semibold text-white">Log in</a>
      </div>
    );
  }

  const ids = Object.keys(mine);
  const completed = ids.filter((i) => mine[i] === "completed");
  const saved = ids.filter((i) => mine[i] === "saved");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-16">
      <h1 className="text-3xl font-bold text-[#1f1f1f]">My Learning</h1>
      {ids.length > 0 && (
        <p className="mt-2 text-slate-600">
          {completed.length} of {courses.length} courses completed · {saved.length} saved for later
        </p>
      )}
      {ids.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-600">You haven't saved any courses yet.</p>
          <a href="#/" className="mt-4 inline-block rounded-lg bg-[#0056D2] px-5 py-2.5 font-semibold text-white">Browse courses</a>
        </div>
      )}
      <Grid title="Saved for later" ids={saved} byId={byId} />
      <Grid title="Completed" ids={completed} byId={byId} />
    </div>
  );
}
