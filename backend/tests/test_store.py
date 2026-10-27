"""Run with:  python -m tests.test_store   (from the backend/ folder)"""
import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from app import store  # noqa: E402  (must come after DB_PATH is set)


def test_signup_login_session():
    store.init_db()
    user = store.create_user("  Ada Lovelace ", "Ada@Example.com", "correct horse")
    assert user["name"] == "Ada Lovelace" and user["email"] == "ada@example.com"
    assert "password" not in user and "password_hash" not in user
    assert store.authenticate("ada@example.com", "correct horse")["id"] == user["id"]
    assert store.authenticate("ada@example.com", "wrong password") is None
    assert store.authenticate("nobody@example.com", "whatever12") is None
    token = store.create_session(user["id"])
    assert store.user_for_token(token)["email"] == "ada@example.com"
    store.delete_session(token)
    assert store.user_for_token(token) is None
    assert store.user_for_token("garbage") is None


def test_validation_and_duplicates():
    for args in [("", "a@b.co", "longenough"), ("A", "not-an-email", "longenough"), ("A", "a@b.co", "short")]:
        try:
            store.create_user(*args)
            assert False, f"should have rejected {args}"
        except ValueError:
            pass
    store.create_user("Bob", "bob@example.com", "password123")
    try:
        store.create_user("Bob2", "BOB@example.com", "password123")
        assert False
    except ValueError as e:
        assert "already exists" in str(e)


def test_user_courses():
    uid = store.authenticate("ada@example.com", "correct horse")["id"]
    store.set_course(uid, "pyfe", "saved")
    store.set_course(uid, "pyfe", "completed")      # upsert
    store.set_course(uid, "algo1", "saved")
    got = {c["id"]: c["status"] for c in store.list_courses(uid)}
    assert got == {"pyfe": "completed", "algo1": "saved"}
    store.remove_course(uid, "algo1")
    assert [c["id"] for c in store.list_courses(uid)] == ["pyfe"]
    try:
        store.set_course(uid, "pyfe", "bogus")
        assert False
    except ValueError:
        pass
    assert store.update_name(uid, "Ada L.")["name"] == "Ada L."


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("PASS", name)
