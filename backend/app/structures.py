"""Hand-written data structures used by the recommendation engine.

Nothing in here uses heapq, networkx, etc. on purpose, so every piece can be
explained (and traced by hand) in the viva.
"""
from collections import deque


# ---------------------------------------------------------------- Trie ----
class TrieNode:
    __slots__ = ("children", "course_ids")

    def __init__(self):
        self.children = {}      # char -> TrieNode
        self.course_ids = []    # ids of courses whose title passes through here


class Trie:
    """Prefix tree over lower-cased course-title words.

    Every word of a title is inserted, so typing "graph" finds
    "Algorithms, Part II" if graphs appear in its title, and typing "deep"
    finds both "Deep Learning ..." and "Practical Deep Learning ...".
    insert: O(L)   search by prefix: O(L + matches)
    """

    def __init__(self):
        self.root = TrieNode()

    def insert(self, word, course_id):
        node = self.root
        for ch in word.lower():
            node = node.children.setdefault(ch, TrieNode())
            if course_id not in node.course_ids:
                node.course_ids.append(course_id)

    def starts_with(self, prefix):
        node = self.root
        for ch in prefix.lower():
            if ch not in node.children:
                return []
            node = node.children[ch]
        return list(node.course_ids)


# ------------------------------------------------------------ Min-heap ----
class MinHeap:
    """Array-backed binary min-heap of (score, item) pairs.

    push / pop: O(log n)    peek: O(1)
    """

    def __init__(self):
        self.a = []

    def __len__(self):
        return len(self.a)

    def peek(self):
        return self.a[0]

    def push(self, score, item):
        self.a.append((score, item))
        self._sift_up(len(self.a) - 1)

    def pop(self):
        top = self.a[0]
        last = self.a.pop()
        if self.a:
            self.a[0] = last
            self._sift_down(0)
        return top

    def _sift_up(self, i):
        while i > 0:
            parent = (i - 1) // 2
            if self.a[i][0] < self.a[parent][0]:
                self.a[i], self.a[parent] = self.a[parent], self.a[i]
                i = parent
            else:
                break

    def _sift_down(self, i):
        n = len(self.a)
        while True:
            left, right, smallest = 2 * i + 1, 2 * i + 2, i
            if left < n and self.a[left][0] < self.a[smallest][0]:
                smallest = left
            if right < n and self.a[right][0] < self.a[smallest][0]:
                smallest = right
            if smallest == i:
                break
            self.a[i], self.a[smallest] = self.a[smallest], self.a[i]
            i = smallest


def top_k(scored_items, k):
    """Best k (score, item) pairs, highest first, in O(n log k).

    Keeps a min-heap of size k: the root is always the *weakest* of the
    current best k, so a new candidate only has to beat the root.
    """
    if k <= 0:
        return []
    heap = MinHeap()
    for score, item in scored_items:
        if len(heap) < k:
            heap.push(score, item)
        elif score > heap.peek()[0]:
            heap.pop()
            heap.push(score, item)
    result = []
    while len(heap):
        result.append(heap.pop())
    result.reverse()  # popped weakest-first, so reverse
    return result


# ---------------------------------------------------------- Union-Find ----
class UnionFind:
    """Disjoint sets with path compression + union by size (~O(1) amortised)."""

    def __init__(self, items):
        self.parent = {x: x for x in items}
        self.size = {x: 1 for x in items}

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]

    def groups(self):
        out = {}
        for x in self.parent:
            out.setdefault(self.find(x), []).append(x)
        return list(out.values())


# --------------------------------------------------------------- Graph ----
class Graph:
    """Adjacency-list graph (directed or undirected, optionally weighted)."""

    def __init__(self, nodes, directed=False):
        self.directed = directed
        self.adj = {n: [] for n in nodes}   # node -> list of (neighbour, weight)

    def add_edge(self, u, v, weight=1.0):
        self.adj[u].append((v, weight))
        if not self.directed:
            self.adj[v].append((u, weight))

    def edges(self):
        seen = set()
        for u, nbrs in self.adj.items():
            for v, w in nbrs:
                key = (u, v) if self.directed else tuple(sorted((u, v)))
                if key not in seen:
                    seen.add(key)
                    yield u, v, w

    def bfs(self, start, max_depth=None):
        """Breadth-first search. Returns {node: hops_from_start}. O(V + E)."""
        dist = {start: 0}
        q = deque([start])
        while q:
            u = q.popleft()
            if max_depth is not None and dist[u] >= max_depth:
                continue
            for v, _ in self.adj[u]:
                if v not in dist:
                    dist[v] = dist[u] + 1
                    q.append(v)
        return dist

    def dfs(self, start):
        """Iterative depth-first search. Returns visit order."""
        seen, order, stack = set(), [], [start]
        while stack:
            u = stack.pop()
            if u in seen:
                continue
            seen.add(u)
            order.append(u)
            for v, _ in reversed(self.adj[u]):
                if v not in seen:
                    stack.append(v)
        return order

    def reversed(self):
        g = Graph(self.adj.keys(), directed=True)
        for u, v, w in self.edges():
            g.add_edge(v, u, w)
        return g

    def topological_sort(self, subset=None):
        """Kahn's algorithm. Returns (order, has_cycle).

        If `subset` is given only those nodes (and edges between them) are
        considered. A cycle exists iff the order is shorter than the node set.
        O(V + E).
        """
        nodes = set(subset) if subset is not None else set(self.adj)
        indeg = {n: 0 for n in nodes}
        for u in nodes:
            for v, _ in self.adj[u]:
                if v in nodes:
                    indeg[v] += 1
        queue = deque(sorted(n for n in nodes if indeg[n] == 0))
        order = []
        while queue:
            u = queue.popleft()
            order.append(u)
            for v, _ in sorted(self.adj[u]):
                if v in nodes:
                    indeg[v] -= 1
                    if indeg[v] == 0:
                        queue.append(v)
        return order, len(order) != len(nodes)
