"""Course recommendation engine: wires the data structures together.

Pipeline:  courses.json -> hash-map store + inverted tag index + title trie
           -> TF-IDF/cosine (+ tag Jaccard) similarity graph
           -> prerequisite DAG
           -> top-K heap ranking | Kahn topological sort | BFS | Union-Find
"""
import json
import re
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .structures import Graph, Trie, UnionFind, top_k

SIM_EDGE_THRESHOLD = 0.12      # min blended similarity to draw a similarity edge
CLUSTER_THRESHOLD = 0.18       # stricter threshold used for Union-Find clusters
TFIDF_WEIGHT, TAG_WEIGHT = 0.7, 0.3


class CycleError(ValueError):
    pass


class CourseEngine:
    def __init__(self, path):
        raw = json.loads(Path(path).read_text(encoding="utf-8"))

        # 1. Hash map: O(1) lookup by course id
        self.courses = {c["id"]: c for c in raw}
        self.categories = sorted({c["category"] for c in raw})
        self.ids = [c["id"] for c in raw]
        self._validate_references()

        # 2. Inverted index: tag -> course ids
        self.tag_index = {}
        for c in raw:
            for tag in c["tags"]:
                self.tag_index.setdefault(tag, []).append(c["id"])

        # 3. Trie over title words for autocomplete
        self.trie = Trie()
        for c in raw:
            for word in re.findall(r"[A-Za-z0-9+#.]+", c["title"]):
                if len(word) >= 2:
                    self.trie.insert(word, c["id"])

        # 4. Prerequisite DAG (edge: prerequisite -> course)
        self.dag = Graph(self.ids, directed=True)
        for c in raw:
            for p in c["prerequisites"]:
                self.dag.add_edge(p, c["id"])
        self.dag_reverse = self.dag.reversed()
        _, has_cycle = self.dag.topological_sort()
        if has_cycle:
            raise CycleError("courses.json prerequisites contain a cycle")

        # 5. Similarity: TF-IDF cosine blended with tag Jaccard
        docs = [f'{c["title"]}. {c["description"]} {" ".join(c["tags"])}' for c in raw]
        tfidf = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
        cos = cosine_similarity(tfidf.fit_transform(docs))
        self.sim = {}  # (id_a, id_b) -> blended score
        n = len(self.ids)
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                a, b = self.ids[i], self.ids[j]
                jac = self._jaccard(self.courses[a]["tags"], self.courses[b]["tags"])
                self.sim[(a, b)] = float(TFIDF_WEIGHT * cos[i][j] + TAG_WEIGHT * jac)

        # 6. Weighted undirected similarity graph
        self.sim_graph = Graph(self.ids, directed=False)
        for i in range(n):
            for j in range(i + 1, n):
                s = self.sim[(self.ids[i], self.ids[j])]
                if s >= SIM_EDGE_THRESHOLD:
                    self.sim_graph.add_edge(self.ids[i], self.ids[j], round(s, 3))

    # ------------------------------------------------------------ helpers --
    def _validate_references(self):
        for c in self.courses.values():
            for p in c["prerequisites"]:
                if p not in self.courses:
                    raise ValueError(f'{c["id"]}: unknown prerequisite "{p}"')

    @staticmethod
    def _jaccard(a, b):
        sa, sb = set(a), set(b)
        return len(sa & sb) / len(sa | sb) if sa | sb else 0.0

    def get(self, course_id):
        return self.courses.get(course_id)

    # ------------------------------------------------------------- search --
    def autocomplete(self, query, limit=8):
        """Every query word must prefix-match some title word (trie lookups)."""
        tokens = [t for t in re.findall(r"[A-Za-z0-9+#.]+", query.lower()) if t]
        if not tokens:
            return []
        matches = None
        for t in tokens:
            found = set(self.trie.starts_with(t))
            matches = found if matches is None else matches & found
        ordered = [i for i in self.ids if i in (matches or set())]
        return [self.courses[i] for i in ordered[:limit]]

    # ---------------------------------------------------- recommendations --
    def recommend(self, liked_ids, k=5):
        """Top-K courses most similar (on average) to everything in liked_ids.

        Candidates are scored in O(n * |liked|); the heap keeps the best k in
        O(n log k) instead of sorting all n.
        """
        liked = [i for i in liked_ids if i in self.courses]
        if not liked:
            return []
        liked_set = set(liked)
        scored = []
        for cid in self.ids:
            if cid in liked_set:
                continue
            score = sum(self.sim[(l, cid)] for l in liked) / len(liked)
            scored.append((score, cid))
        results = []
        for score, cid in top_k(scored, k):
            c = self.courses[cid]
            shared = sorted(set(c["tags"]) & {t for l in liked for t in self.courses[l]["tags"]})
            missing = [p for p in c["prerequisites"] if p not in liked_set]
            results.append({
                **c,
                "score": round(score, 3),
                "shared_tags": shared,
                "missing_prerequisites": [self._brief(p) for p in missing],
            })
        return results

    def next_courses(self, done_ids, known_ids, k=6):
        """Courses the learner is *ready* for: not started yet, and every
        prerequisite already completed. Ranked by similarity to what the
        learner already has (same min-heap top-K as recommend)."""
        done = set(done_ids)
        known = [i for i in known_ids if i in self.courses]
        known_set = set(known)
        scored = []
        for cid in self.ids:
            c = self.courses[cid]
            if cid in known_set or any(p not in done for p in c["prerequisites"]):
                continue
            score = sum(self.sim[(l, cid)] for l in known) / len(known) if known else 0.0
            scored.append((score, cid))
        return [dict(self.courses[cid], score=round(score, 3)) for score, cid in top_k(scored, k)]

    def related(self, course_id, depth=2):
        """BFS over the similarity graph: courses reachable within `depth` hops."""
        dist = self.sim_graph.bfs(course_id, max_depth=depth)
        return [
            {**self._brief(cid), "hops": d}
            for cid, d in sorted(dist.items(), key=lambda kv: (kv[1], kv[0]))
            if cid != course_id
        ]

    # ------------------------------------------------------ learning path --
    def learning_path(self, target_id, completed_ids=()):
        """Ordered list of courses to take so that target_id becomes unlocked.

        1. Walk the reversed DAG from the target to collect all ancestors (DFS).
        2. Run Kahn's algorithm restricted to those nodes -> valid order.
        """
        needed = set(self.dag_reverse.dfs(target_id)) - set(completed_ids)
        needed.add(target_id)
        order, has_cycle = self.dag.topological_sort(subset=needed)
        if has_cycle:
            raise CycleError("cycle detected while building path")
        return [{**self._brief(cid), "step": i + 1} for i, cid in enumerate(order)]

    # ----------------------------------------------------------- clusters --
    def clusters(self):
        """Union-Find over strong similarity edges -> topic communities."""
        uf = UnionFind(self.ids)
        for u, v, w in self.sim_graph.edges():
            if w >= CLUSTER_THRESHOLD:
                uf.union(u, v)
        out = []
        for members in uf.groups():
            counts = {}
            for m in members:
                for t in self.courses[m]["tags"]:
                    counts[t] = counts.get(t, 0) + 1
            label = sorted(counts, key=lambda t: (-counts[t], t))[:2]
            out.append({
                "label": " / ".join(label),
                "courses": [self._brief(m) for m in sorted(members)],
            })
        out.sort(key=lambda c: -len(c["courses"]))
        return out

    # ------------------------------------------------------- graph export --
    def graph_data(self):
        return {
            "nodes": [self._brief(i) for i in self.ids],
            "prerequisites": [{"from": u, "to": v} for u, v, _ in self.dag.edges()],
            "similarity": [{"a": u, "b": v, "weight": w} for u, v, w in self.sim_graph.edges()],
        }

    def _brief(self, cid):
        c = self.courses[cid]
        return {
            "id": cid, "title": c["title"], "provider": c["provider"],
            "level": c["level"], "category": c["category"], "url": c["url"],
        }
