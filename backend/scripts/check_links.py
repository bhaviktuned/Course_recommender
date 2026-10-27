"""Checks every course URL in data/courses.json.   Run from backend/:  python scripts/check_links.py

Needs internet. Interpreting results:
  OK        page loads
  BLOCKED   403/429: the site refuses scripts (Coursera often does); open it in a browser to confirm
  BROKEN    404 or other error: fix the url in data/courses.json
"""
import json
import urllib.error
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "courses.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; link-check)"}

for c in json.loads(DATA.read_text(encoding="utf-8")):
    try:
        req = urllib.request.Request(c["url"], headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            status = f"OK       {r.status}"
    except urllib.error.HTTPError as e:
        status = f"BLOCKED  {e.code}" if e.code in (403, 429) else f"BROKEN   {e.code}"
    except Exception as e:  # DNS failure, timeout, ...
        status = f"BROKEN   {type(e).__name__}"
    print(f'{status:<14}{c["id"]:<11}{c["url"]}')
