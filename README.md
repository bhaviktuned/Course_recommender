# CourseMap: Online Course Recommendation System

Browse real online courses, get recommendations, see exactly which courses to take
first, and keep track of your progress with your own account.
(DSA-2 PBL project: graph, heap, trie, union-find, topological sort.)

## What the app does

- Coursera-style home page with search, topic chips and level filter
- Search box with live suggestions (trie-based autocomplete)
- Course page with a **Go to course** button that opens the original course
- "Your path to this course": ordered prerequisites shown as a diagram and a list
- Sign up / log in; hamburger menu with profile, My Learning and topics
- Save courses for later or mark them completed
- "Ready for you next" (prerequisites done) and "Recommended for you" rows

## Project structure

```
course-recommender/
├── README.md
├── backend/                       FastAPI + Python
│   ├── requirements.txt
│   ├── data/courses.json          29 real courses: title, provider, url, category, level, tags, prerequisites
│   ├── app/
│   │   ├── structures.py          Trie, MinHeap + top_k, UnionFind, Graph (BFS/DFS/Kahn)
│   │   ├── engine.py              Recommendations, learning paths, clusters
│   │   ├── store.py               Accounts, sessions, saved/completed courses (SQLite)
│   │   └── main.py                REST API
│   ├── tests/                     test_engine.py, test_store.py
│   └── scripts/check_links.py     Checks that every course URL still works
└── frontend/                      React + Tailwind (Vite)
    ├── package.json, vite.config.js, index.html
    └── src/
        ├── main.jsx, App.jsx, index.css, api.js, router.js, context.jsx, lib.js
        ├── components/            Navbar, Drawer (hamburger menu), SearchBox, CourseCard, PathGraph, ...
        └── pages/                 Home, Course, Search, MyLearning, Profile, Auth
```

## How to run

You need Python 3.10+ and Node.js 18+. Use two terminals.

### Terminal 1: backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate              # Windows
# source venv/bin/activate         # Mac / Linux
pip install -r requirements.txt

python -m tests.test_engine        # optional checks, each prints PASS lines
python -m tests.test_store

uvicorn app.main:app --reload
```

API: http://localhost:8000  (interactive docs at http://localhost:8000/docs).
The first run creates `backend/data/app.db` (the user database) automatically.

### Terminal 2: frontend

```bash
cd frontend
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).
If the API is not on port 8000, copy `.env.example` to `.env` and set `VITE_API_URL`.

### Try it

1. Click **Join for free**, create an account.
2. Search "deep" or "alg", open a course, press **Mark as completed** or **Save for later**.
3. Go back home: "Ready for you next" and "Recommended for you" appear.
4. Open the hamburger menu: My Learning, Profile, topics, Log out.
5. Open "Natural Language Processing Specialization" to see the prerequisite path.

## Checking the course links

Run `python scripts/check_links.py` from `backend/` (needs internet). Sites like Coursera
sometimes answer scripts with "BLOCKED"; open those in a browser to confirm. Fix any
BROKEN link in `backend/data/courses.json`.

## API summary

| Endpoint | Purpose |
| --- | --- |
| `GET /api/courses`, `/api/courses/{id}`, `/api/categories` | Catalogue |
| `GET /api/search?q=` | Trie autocomplete on title words |
| `GET /api/recommend?liked=a,b&k=5` | Top-K similar courses (heap) |
| `GET /api/path/{id}?completed=a,b` | Ordered prerequisites (DFS + Kahn's algorithm) |
| `GET /api/related/{id}`, `/api/clusters`, `/api/graph` | BFS neighbours, Union-Find clusters, graph data |
| `POST /api/auth/signup`, `/login`, `/logout` | Accounts |
| `GET/PATCH /api/me` | Profile |
| `GET /api/me/courses`, `PUT/DELETE /api/me/courses/{id}` | Saved / completed courses |
| `GET /api/me/recommendations`, `/api/me/next` | Personal recommendations / courses ready to start |

## Accounts and security

- Passwords are never stored, only salted PBKDF2-SHA256 hashes (200,000 rounds).
- Login tokens are random; only their SHA-256 hash is stored, and they expire after 30 days.
- Basic project-level security: there is no rate limiting or email verification.

## Where each DSA concept lives

| Concept | Location | Complexity |
| --- | --- | --- |
| Hash map (course store) | `engine.courses` | O(1) lookup |
| Inverted index (tag -> courses) | `engine.tag_index` | O(1) per tag |
| Trie (title autocomplete) | `structures.Trie`, `engine.autocomplete` | O(L + matches) |
| Weighted similarity graph | `structures.Graph`; TF-IDF cosine (70%) + tag Jaccard (30%) | O(n^2) build |
| Min-heap top-K | `structures.MinHeap`, `top_k`; `engine.recommend`, `engine.next_courses` | O(n log k) |
| DAG + Kahn's algorithm | `Graph.topological_sort`, `engine.learning_path` | O(V + E) |
| DFS on reversed DAG | `Graph.dfs`, `engine.learning_path` | O(V + E) |
| BFS | `Graph.bfs`, `engine.related` | O(V + E) |
| Union-Find | `structures.UnionFind`, `engine.clusters` | ~O(1) amortised |

The engine refuses to start if `courses.json` contains a prerequisite cycle or an unknown id.

## About the data

Course titles and providers are real. The descriptions are short summaries and the
prerequisite links are curated from topic dependencies, because platforms rarely publish
official prerequisite chains. State this in your report.

## Deployment

- Backend (Render): build `pip install -r backend/requirements.txt`, start
  `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  Render's free disk is wiped on redeploy, so accounts reset; attach a persistent disk and set the
  `DB_PATH` environment variable to a file on it (or move to a hosted database).
- Frontend (Vercel, root directory `frontend`): set `VITE_API_URL` to the Render URL.
- Replace `allow_origins=["*"]` in `backend/app/main.py` with your Vercel domain.

## Troubleshooting

- "We can't reach the server": the backend isn't running, or `VITE_API_URL` is wrong.
- `ModuleNotFoundError: app`: run `uvicorn` and the tests from inside `backend/`.
- Logged out unexpectedly: deleting `backend/data/app.db` wipes all accounts and sessions.
