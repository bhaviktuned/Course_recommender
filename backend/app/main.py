from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import store
from .engine import CourseEngine

app = FastAPI(title="Course Recommender API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

engine = CourseEngine(Path(__file__).resolve().parent.parent / "data" / "courses.json")
store.init_db()


# ------------------------------------------------------------- helpers ----
def _ids(csv: str):
    return [x for x in (csv or "").split(",") if x]


def _require(course_id: str):
    course = engine.get(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail=f"Unknown course '{course_id}'")
    return course


def current_user(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Please log in.")
    user = store.user_for_token(authorization[7:])
    if user is None:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
    return user


# -------------------------------------------------------------- models ----
class SignupBody(BaseModel):
    name: str = ""
    email: str = ""
    password: str = ""


class LoginBody(BaseModel):
    email: str = ""
    password: str = ""


class NameBody(BaseModel):
    name: str = ""


class StatusBody(BaseModel):
    status: str = ""


# -------------------------------------------------------------- catalog ----
@app.get("/api/health")
def health():
    return {"status": "ok", "courses": len(engine.ids)}


@app.get("/api/courses")
def list_courses():
    return list(engine.courses.values())


@app.get("/api/categories")
def categories():
    return engine.categories


@app.get("/api/courses/{course_id}")
def get_course(course_id: str):
    return _require(course_id)


@app.get("/api/search")
def search(q: str = Query("", max_length=80), limit: int = Query(8, ge=1, le=50)):
    return engine.autocomplete(q, limit)


@app.get("/api/recommend")
def recommend(liked: str = "", k: int = Query(5, ge=1, le=20)):
    ids = _ids(liked)
    for i in ids:
        _require(i)
    return engine.recommend(ids, k)


@app.get("/api/related/{course_id}")
def related(course_id: str, depth: int = Query(2, ge=1, le=4)):
    _require(course_id)
    return engine.related(course_id, depth)


@app.get("/api/path/{course_id}")
def path(course_id: str, completed: str = ""):
    _require(course_id)
    return engine.learning_path(course_id, _ids(completed))


@app.get("/api/clusters")
def clusters():
    return engine.clusters()


@app.get("/api/graph")
def graph():
    return engine.graph_data()


# ----------------------------------------------------------------- auth ----
@app.post("/api/auth/signup")
def signup(body: SignupBody):
    try:
        user = store.create_user(body.name, body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"token": store.create_session(user["id"]), "user": user}


@app.post("/api/auth/login")
def login(body: LoginBody):
    user = store.authenticate(body.email, body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return {"token": store.create_session(user["id"]), "user": user}


@app.post("/api/auth/logout")
def logout(authorization: str = Header(default="")):
    if authorization.startswith("Bearer "):
        store.delete_session(authorization[7:])
    return {"ok": True}


# ------------------------------------------------------------------ me ----
@app.get("/api/me")
def me(user=Depends(current_user)):
    mine = store.list_courses(user["id"])
    return {
        **user,
        "saved": sum(1 for c in mine if c["status"] == "saved"),
        "completed": sum(1 for c in mine if c["status"] == "completed"),
    }


@app.patch("/api/me")
def update_me(body: NameBody, user=Depends(current_user)):
    try:
        return store.update_name(user["id"], body.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/me/courses")
def my_courses(user=Depends(current_user)):
    return store.list_courses(user["id"])


@app.put("/api/me/courses/{course_id}")
def set_my_course(course_id: str, body: StatusBody, user=Depends(current_user)):
    _require(course_id)
    try:
        store.set_course(user["id"], course_id, body.status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return store.list_courses(user["id"])


@app.delete("/api/me/courses/{course_id}")
def remove_my_course(course_id: str, user=Depends(current_user)):
    store.remove_course(user["id"], course_id)
    return store.list_courses(user["id"])


@app.get("/api/me/recommendations")
def my_recommendations(k: int = Query(6, ge=1, le=20), user=Depends(current_user)):
    ids = [c["id"] for c in store.list_courses(user["id"])]
    return engine.recommend(ids, k) if ids else []


@app.get("/api/me/next")
def my_next(k: int = Query(6, ge=1, le=20), user=Depends(current_user)):
    mine = store.list_courses(user["id"])
    done = [c["id"] for c in mine if c["status"] == "completed"]
    return engine.next_courses(done, [c["id"] for c in mine], k)
