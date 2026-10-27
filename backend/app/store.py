"""User accounts, login sessions and each learner's saved/completed courses.

Uses only the standard library (sqlite3 + hashlib), so there is nothing extra
to install. Passwords are never stored: only a salted PBKDF2-SHA256 hash.
Session tokens are random and only their SHA-256 hash is stored.
"""
import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.environ.get("DB_PATH", Path(__file__).resolve().parent.parent / "data" / "app.db"))
SESSION_SECONDS = 30 * 24 * 3600
PBKDF2_ROUNDS = 200_000
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
STATUSES = ("saved", "completed")


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                salt BLOB NOT NULL,
                password_hash BLOB NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_courses (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id TEXT NOT NULL,
                status TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (user_id, course_id)
            );
            """
        )


# ----------------------------------------------------------- passwords ----
def _hash(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ROUNDS)


def _public(row):
    return {"id": row["id"], "name": row["name"], "email": row["email"], "created_at": row["created_at"]}


def _validate(name, email, password):
    name, email = (name or "").strip(), (email or "").strip().lower()
    if not 1 <= len(name) <= 60:
        raise ValueError("Please enter your name (up to 60 characters).")
    if len(email) > 254 or not EMAIL_RE.match(email):
        raise ValueError("Please enter a valid email address.")
    if not 8 <= len(password or "") <= 128:
        raise ValueError("Password must be at least 8 characters.")
    return name, email


# --------------------------------------------------------------- users ----
def create_user(name, email, password):
    name, email = _validate(name, email, password)
    salt = os.urandom(16)
    try:
        with connect() as db:
            cur = db.execute(
                "INSERT INTO users (name, email, salt, password_hash, created_at) VALUES (?,?,?,?,?)",
                (name, email, salt, _hash(password, salt), int(time.time())),
            )
            row = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    except sqlite3.IntegrityError:
        raise ValueError("An account with this email already exists.")
    return _public(row)


def authenticate(email, password):
    """Returns the user dict, or None for a wrong email/password."""
    email = (email or "").strip().lower()
    with connect() as db:
        row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if row is None:
        _hash(password or "", b"\x00" * 16)  # same work as a real check, so timing doesn't reveal accounts
        return None
    if hmac.compare_digest(_hash(password or "", row["salt"]), row["password_hash"]):
        return _public(row)
    return None


def update_name(user_id, name):
    name = (name or "").strip()
    if not 1 <= len(name) <= 60:
        raise ValueError("Please enter your name (up to 60 characters).")
    with connect() as db:
        db.execute("UPDATE users SET name = ? WHERE id = ?", (name, user_id))
        return _public(db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())


# ------------------------------------------------------------ sessions ----
def _token_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user_id):
    token = secrets.token_urlsafe(32)
    with connect() as db:
        db.execute(
            "INSERT INTO sessions (token_hash, user_id, created_at) VALUES (?,?,?)",
            (_token_hash(token), user_id, int(time.time())),
        )
    return token


def user_for_token(token):
    if not token:
        return None
    with connect() as db:
        row = db.execute(
            "SELECT u.*, s.created_at AS session_created FROM sessions s "
            "JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
            (_token_hash(token),),
        ).fetchone()
        if row is None:
            return None
        if time.time() - row["session_created"] > SESSION_SECONDS:
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))
            return None
    return _public(row)


def delete_session(token):
    with connect() as db:
        db.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))


# -------------------------------------------------------- user courses ----
def set_course(user_id, course_id, status):
    if status not in STATUSES:
        raise ValueError("Status must be 'saved' or 'completed'.")
    with connect() as db:
        db.execute(
            "INSERT INTO user_courses (user_id, course_id, status, updated_at) VALUES (?,?,?,?) "
            "ON CONFLICT(user_id, course_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at",
            (user_id, course_id, status, int(time.time())),
        )


def remove_course(user_id, course_id):
    with connect() as db:
        db.execute("DELETE FROM user_courses WHERE user_id = ? AND course_id = ?", (user_id, course_id))


def list_courses(user_id):
    with connect() as db:
        rows = db.execute(
            "SELECT course_id, status FROM user_courses WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)
        ).fetchall()
    return [{"id": r["course_id"], "status": r["status"]} for r in rows]
