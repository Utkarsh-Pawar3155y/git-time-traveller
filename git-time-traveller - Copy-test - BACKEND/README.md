# Git History Time Traveller 🕰️
### Git History Visualizer – FastAPI Backend

---

## Folder Structure

```
git-time-traveller/
├── main.py               # FastAPI app, endpoints, cloning logic
├── requirements.txt      # All dependencies
├── utils/
│   ├── __init__.py
│   └── git_parser.py     # All git parsing + analytics engine
└── README.md             # This file
```

---

## Requirements

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
gitpython==3.1.43
pydantic==2.7.1
networkx==3.3
```

---

## How to Run

### 1. Install dependencies

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the server

```bash
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Open docs

- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc
- Health:      http://localhost:8000/health

---

## API Reference

### GET /health
```json
{ "status": "ok", "service": "Git History Time Traveller", "version": "1.0.0" }
```

### POST /analyze

**Request body:**
```json
{
  "repo_url": "https://github.com/pallets/flask",
  "branch": "main",         
  "max_commits": 500        
}
```
Only `repo_url` is required.

---

## Example JSON Response

```json
{
  "summary": {
    "total_commits": 4721,
    "total_contributors": 38,
    "total_branches": 12,
    "total_files_tracked": 184
  },
  "timeline": [
    { "date": "2010-04-06", "commits": 3 },
    { "date": "2010-04-07", "commits": 11 }
  ],
  "file_churn": [
    {
      "file": "src/flask/app.py",
      "additions": 12400,
      "deletions": 9800,
      "churn": 22200,
      "commits": 312,
      "contributors": ["Armin Ronacher", "David Lord"],
      "contributor_count": 2
    }
  ],
  "contributors": [
    {
      "author": "David Lord",
      "commits": 1204,
      "lines_added": 48200,
      "lines_deleted": 31000,
      "files_touched": 96,
      "active_days": 380,
      "first_commit": "2014-06-21T09:11:33+00:00",
      "last_commit": "2024-03-15T16:42:00+00:00",
      "commit_share_pct": 25.5
    }
  ],
  "contributor_network": [
    {
      "source": "David Lord",
      "target": "Armin Ronacher",
      "weight": 47,
      "shared_files": ["src/flask/app.py", "src/flask/cli.py"]
    }
  ],
  "activity_calendar": [
    {
      "date": "2024-01-15",
      "total_commits": 4,
      "authors": { "David Lord": 3, "pgjones": 1 },
      "intensity": 1
    }
  ],
  "branches": [
    {
      "name": "main",
      "latest_commit": "a3f9c21",
      "latest_commit_date": "2024-03-15T16:42:00+00:00",
      "author": "David Lord"
    }
  ],
  "hotspots": [
    {
      "file": "src/flask/app.py",
      "hotspot_score": 94.3,
      "churn": 22200,
      "contributor_count": 2,
      "contributors": ["Armin Ronacher", "David Lord"],
      "commits": 312
    }
  ],
  "risk_scores": [
    {
      "file": "src/flask/app.py",
      "risk_score": 88.4,
      "risk_level": "critical",
      "churn": 22200,
      "recent_commits_30d": 3,
      "contributor_count": 2
    }
  ],
  "growth_metrics": {
    "total_commits": 4721,
    "span_days": 5062,
    "commits_per_day_avg": 0.933,
    "total_lines_added": 284000,
    "total_lines_deleted": 198000,
    "net_lines": 86000,
    "commits_last_30d": 8,
    "commits_prev_30d": 5,
    "momentum": "growing",
    "peak_day": "2023-11-22",
    "peak_day_commits": 24,
    "first_commit": "2010-04-06T08:18:03+00:00",
    "latest_commit": "2024-03-15T16:42:00+00:00"
  },
  "health_score": 74,
  "health_factors": [
    "Recent activity: last commit 7 days ago (+0 pts)",
    "Healthy bus factor: top author owns 25.5% of commits (+0 pts)",
    "Moderate code churn ratio (69%) (-10 pts)",
    "2 hotspot files detected (-7 pts)",
    "Growing commit momentum (+0 pts)"
  ],
  "insights": [
    "🏛️ Mature project with 13 years of history.",
    "🌐 Large open-source style project with 38 contributors.",
    "📈 Project is accelerating: 8 commits in the last 30 days vs 5 in the prior period.",
    "🔥 Hottest file: 'src/flask/app.py' with 312 commits, 2 contributors and a hotspot score of 94.3.",
    "📦 Substantial codebase: +86,000 net lines of code.",
    "🌿 12 branches in use.",
    "🟡 Project health is moderate (74/100) – some areas need attention.",
    "⚡ Peak activity was on 2023-11-22 with 24 commits in a single day."
  ],
  "recent_commits": [
    {
      "sha": "a3f9c2100deadbeef...",
      "short_sha": "a3f9c21",
      "author": "David Lord",
      "email": "davidism@gmail.com",
      "date": "2024-03-15T16:42:00+00:00",
      "message": "release version 3.0.3",
      "files_changed": ["CHANGES.rst", "pyproject.toml"],
      "lines_added": 14,
      "lines_deleted": 2
    }
  ],
  "meta": {
    "repo_url": "https://github.com/pallets/flask.git",
    "clone_time_seconds": 8.41,
    "analysis_time_seconds": 22.7,
    "total_time_seconds": 31.11
  }
}
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `422: URL must be a valid...` | Non-GitHub/GitLab URL or typo | Use full URL: `https://github.com/user/repo` |
| `422: Failed to clone repository` | Repo is private or doesn't exist | Use a **public** repository |
| `422: Clone error: ... not found` | Repo deleted or URL wrong | Double-check the repository URL |
| `500: Analysis error` | Corrupted or empty repo | Try a different repository |
| `OSError: [Errno 28] No space left` | Disk full during clone | Free up disk space |
| `Connection refused` on startup | Port 8000 in use | `uvicorn main:app --port 8001` |
| `ModuleNotFoundError: git` | GitPython not installed | `pip install gitpython` |
| Very slow response | Large repo (Linux kernel etc.) | Add `"max_commits": 500` to request body |

---

## Architecture Notes

- **Zero persistence** – every request clones into a fresh `tempfile.mkdtemp()` directory, which is deleted in a `finally` block regardless of success/failure.
- **Blobless clone** (`--filter=blob:none`) makes cloning much faster without sacrificing commit history accuracy.
- **NetworkX** builds the contributor collaboration graph – two developers are connected if they both touched the same file.
- **Health score** is computed from recency, bus factor, churn ratio, hotspot count, and momentum – all rule-based, no ML required.
- **CORS** is open (`allow_origins=["*"]`) for local hackathon use; restrict in production.
