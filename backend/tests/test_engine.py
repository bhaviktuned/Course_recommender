"""Run with:  python -m tests.test_engine   (from the backend/ folder)"""
from pathlib import Path

from app.engine import CourseEngine
from app.structures import MinHeap, Trie, UnionFind, Graph, top_k

DATA = Path(__file__).resolve().parent.parent / "data" / "courses.json"


def test_heap_and_topk():
    h = MinHeap()
    for x in [5, 1, 4, 2, 3]:
        h.push(x, str(x))
    assert [h.pop()[0] for _ in range(5)] == [1, 2, 3, 4, 5]
    best = top_k([(s, str(s)) for s in [7, 3, 9, 1, 8, 2]], 3)
    assert [s for s, _ in best] == [9, 8, 7]


def test_trie():
    t = Trie()
    t.insert("Algorithms", "a")
    t.insert("Algebra", "b")
    assert sorted(t.starts_with("alg")) == ["a", "b"]
    assert t.starts_with("alge") == ["b"]
    assert t.starts_with("xyz") == []


def test_union_find():
    uf = UnionFind(["a", "b", "c", "d"])
    uf.union("a", "b")
    uf.union("c", "d")
    assert uf.find("a") == uf.find("b") != uf.find("c")


def test_cycle_detection():
    g = Graph(["a", "b", "c"], directed=True)
    g.add_edge("a", "b")
    g.add_edge("b", "c")
    g.add_edge("c", "a")
    assert g.topological_sort()[1] is True
    g2 = Graph(["a", "b", "c"], directed=True)
    g2.add_edge("a", "b")
    g2.add_edge("b", "c")
    assert g2.topological_sort() == (["a", "b", "c"], False)


def test_engine():
    e = CourseEngine(DATA)
    path = [p["id"] for p in e.learning_path("nlp")]
    assert path[-1] == "nlp" and path.index("pyfe") < path.index("ml_ng") < path.index("dl")
    assert "algo1" not in [r["id"] for r in e.recommend(["algo1"], 5)]
    assert e.recommend(["algo1"], 1)[0]["id"] == "mit6006"
    assert {c["id"] for c in e.autocomplete("deep")} == {"fastai", "dl", "cs231n"}


def test_next_courses_and_links():
    e = CourseEngine(DATA)
    ready = {c["id"] for c in e.next_courses(["pyfe", "la_ml"], ["pyfe", "la_ml"], 29)}
    assert "ml_ng" in ready and "dl" not in ready          # dl needs ml_ng first
    assert not ready & {"pyfe", "la_ml"}                   # already known
    assert all(c["url"].startswith("https://") and c["category"] for c in e.courses.values())


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("PASS", name)
