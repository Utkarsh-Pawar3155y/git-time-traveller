"""
git_parser.py
Core engine for parsing git history and computing all analytics.
"""

from __future__ import annotations

import math
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import networkx as nx

# Data extraction

def extract_commits(repo, max_commits: int = 2000) -> list[dict]:
    """
    Hybrid commit extraction:
    - Full metadata for many commits (fast)
    - Full numstat only for recent subset (accurate + performant)
    """

    import subprocess

    repo_path = repo.working_dir

    META_LIMIT = min(max_commits, 1500)
    DETAIL_LIMIT = min(300, META_LIMIT)

    SEP = "<<--COMMIT--SEP-->>"
    FMT = f"{SEP}%H|%an|%ae|%at|%s"

    # FAST METADATA EXTRACTION

    cmd_meta = [
        "git", "-C", repo_path,
        "log", "HEAD",
        f"--max-count={META_LIMIT}",
        f"--format={FMT}",
    ]

    try:
        result_meta = subprocess.run(
            cmd_meta,
            capture_output=True,
            text=True,
            timeout=40,
            encoding="utf-8",
            errors="replace",
        )
        raw_meta = result_meta.stdout
    except Exception:
        return []

    if not raw_meta:
        return []

    commits: dict[str, dict] = {}

    blocks = raw_meta.split(SEP)
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        lines = block.splitlines()
        header = lines[0].strip()
        parts = header.split("|", 4)
        if len(parts) < 4:
            continue

        sha, author, email, ts_str = parts[:4]
        message = parts[4] if len(parts) > 4 else ""

        try:
            ts = int(ts_str)
        except ValueError:
            continue

        authored_dt = datetime.fromtimestamp(ts, tz=timezone.utc)

        commits[sha] = {
            "sha": sha,
            "short_sha": sha[:7],
            "author": author or "Unknown",
            "email": email or "",
            "date": authored_dt.isoformat(),
            "date_obj": authored_dt,
            "message": message.strip()[:200],
            "files_changed": [],
            "lines_added": 0,
            "lines_deleted": 0,
        }

    # ----------------------------
    # 2️⃣ DETAILED NUMSTAT (RECENT)
    # ----------------------------
    cmd_detail = [
        "git", "-C", repo_path,
        "log", "HEAD",
        f"--max-count={DETAIL_LIMIT}",
        f"--format={FMT}",
        "--numstat",
    ]

    try:
        result_detail = subprocess.run(
            cmd_detail,
            capture_output=True,
            text=True,
            timeout=60,
            encoding="utf-8",
            errors="replace",
        )
        raw_detail = result_detail.stdout
    except Exception:
        raw_detail = ""

    if raw_detail:
        blocks = raw_detail.split(SEP)
        for block in blocks:
            block = block.strip()
            if not block:
                continue

            lines = block.splitlines()
            header = lines[0].strip()
            parts = header.split("|", 4)
            if len(parts) < 4:
                continue

            sha = parts[0]

            if sha not in commits:
                continue

            files_changed = []
            lines_added = 0
            lines_deleted = 0

            for stat_line in lines[1:]:
                stat_line = stat_line.strip()
                if not stat_line:
                    continue

                parts2 = stat_line.split("\t", 2)
                if len(parts2) < 3:
                    continue

                added_str, deleted_str, fname = parts2

                try:
                    lines_added += int(added_str)
                except ValueError:
                    pass

                try:
                    lines_deleted += int(deleted_str)
                except ValueError:
                    pass

                if fname:
                    files_changed.append(fname)

            commits[sha]["files_changed"] = files_changed
            commits[sha]["lines_added"] = lines_added
            commits[sha]["lines_deleted"] = lines_deleted

    # ----------------------------
    # Finalize list
    # ----------------------------
    commit_list = list(commits.values())
    commit_list.sort(key=lambda c: c["date_obj"], reverse=True)

    return commit_list

def extract_branches(repo) -> list[dict]:
    """
    Extract both local and remote branches with commit counts.
    """

    import subprocess

    branches = []
    repo_path = repo.working_dir
    seen = set()

    try:

        # --- LOCAL BRANCHES ---
        for branch in repo.branches:
            seen.add(branch.name)

            cmd = ["git", "-C", repo_path, "rev-list", "--count", branch.name]

            result = subprocess.run(cmd, capture_output=True, text=True)
            count = int(result.stdout.strip() or 0)

            branches.append(
                {
                    "name": branch.name,
                    "git_ref": branch.name,
                    "commits": count,
                }
            )       

        # --- REMOTE BRANCHES ---
        for ref in repo.remotes.origin.refs:

            display_name = ref.name.replace("origin/", "")
            internal_name = ref.name

            if display_name in seen or display_name == "HEAD":
                continue

            cmd = ["git", "-C", repo_path, "rev-list", "--count", ref.name]

            result = subprocess.run(cmd, capture_output=True, text=True)
            count = int(result.stdout.strip() or 0)

            branches.append(
                {
                    "name": display_name,
                    "git_ref": internal_name,
                    "commits": count,
                }
            )

    except Exception:
        pass

    return branches

def build_branch_relations(repo, branches):
    """
    Create branch relations using commit ancestry.
    If branch B contains commits from A, we connect A -> B.
    """

    import subprocess

    repo_path = repo.working_dir
    edges = []

    names = [b["git_ref"] for b in branches]

    for a in names:
        for b in names:

            if a == b:
                continue

            try:
                cmd = [
                    "git",
                    "-C",
                    repo_path,
                    "merge-base",
                    "--is-ancestor",
                    a,
                    b,
                ]

                result = subprocess.run(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )               

                # exit code 0 means A is ancestor of B
                if result.returncode == 0:
                    edges.append({
                        "source": a.replace("origin/", ""),
                        "target": b.replace("origin/", "")
                    })

            except Exception:
                pass

    return edges


# ---------------------------------------------------------------------------
# Timeline
# ---------------------------------------------------------------------------

def build_timeline(commits: list[dict]) -> list[dict]:
    """Commits grouped by calendar day."""
    day_counts: dict[str, int] = defaultdict(int)
    for c in commits:
        day = c["date_obj"].strftime("%Y-%m-%d")
        day_counts[day] += 1

    return [
        {"date": day, "commits": count}
        for day, count in sorted(day_counts.items())
    ]


# ---------------------------------------------------------------------------
# File churn
# ---------------------------------------------------------------------------

def build_file_churn(commits: list[dict]) -> list[dict]:
    file_stats: dict[str, dict] = defaultdict(
        lambda: {
        "additions": 0,
        "deletions": 0,
        "commits": 0,
        "contributors": set(),
        "last_modified": None   # NEW
        }
    )       

    for c in commits:           
        for f in c["files_changed"]:
            file_stats[f]["commits"] += 1
            file_stats[f]["contributors"].add(c["author"])

            # track last modification
            if (
                file_stats[f]["last_modified"] is None
                or c["date_obj"] > file_stats[f]["last_modified"]
            ):
                file_stats[f]["last_modified"] = c["date_obj"]
        
        
        
        
        # Per-commit totals spread across files for approximation
        n = len(c["files_changed"]) or 1
        for f in c["files_changed"]:
            file_stats[f]["additions"] += c["lines_added"] // n
            file_stats[f]["deletions"] += c["lines_deleted"] // n

    result = []
    for filepath, stats in file_stats.items():
        churn = stats["additions"] + stats["deletions"]
        result.append(
            {
                "file": filepath,
                "folder": filepath.split("/")[0] if "/" in filepath else "root",
                "additions": stats["additions"],
                "deletions": stats["deletions"],
                "churn": churn,
                "commits": stats["commits"],
                "change_frequency": stats["commits"],   # NEW
                "contributors": list(stats["contributors"]),
                "contributor_count": len(stats["contributors"]),
                "last_modified": stats["last_modified"].isoformat() if stats["last_modified"] else None
            }
        )

    result.sort(key=lambda x: x["change_frequency"], reverse=True)
    return result[:200]  # Cap for response size


# ---------------------------------------------------------------------------
# Contributors
# ---------------------------------------------------------------------------

def build_contributor_stats(commits: list[dict]) -> list[dict]:
    author_data: dict[str, dict] = defaultdict(
        lambda: {
            "commits": 0,
            "lines_added": 0,
            "lines_deleted": 0,
            "files": set(),
            "first_commit": None,
            "last_commit": None,
            "active_days": set(),
        }
    )
    for c in commits:
        a = c["author"]
        d = author_data[a]
        d["commits"] += 1
        d["lines_added"] += c["lines_added"]
        d["lines_deleted"] += c["lines_deleted"]
        d["files"].update(c["files_changed"])
        day = c["date_obj"].strftime("%Y-%m-%d")
        d["active_days"].add(day)
        if d["first_commit"] is None or c["date_obj"] < d["first_commit"]:
            d["first_commit"] = c["date_obj"]
        if d["last_commit"] is None or c["date_obj"] > d["last_commit"]:
            d["last_commit"] = c["date_obj"]

    total_commits = len(commits) or 1
    result = []
    for author, d in author_data.items():
        result.append(
            {
                "author": author,
                "commits": d["commits"],
                "lines_added": d["lines_added"],
                "lines_deleted": d["lines_deleted"],
                "files_touched": len(d["files"]),
                "active_days": len(d["active_days"]),
                "first_commit": d["first_commit"].isoformat() if d["first_commit"] else None,
                "last_commit": d["last_commit"].isoformat() if d["last_commit"] else None,
                "commit_share_pct": round(d["commits"] / total_commits * 100, 2),
            }
        )

    result.sort(key=lambda x: x["commits"], reverse=True)
    return result


# ---------------------------------------------------------------------------
# Contributor-file mapping (for graph edges)
# ---------------------------------------------------------------------------

def build_contributor_file_map(commits: list[dict]) -> dict[str, list[str]]:
    mapping: dict[str, set] = defaultdict(set)
    for c in commits:
        for f in c["files_changed"]:
            mapping[c["author"]].add(f)
    return {author: list(files) for author, files in mapping.items()}


# ---------------------------------------------------------------------------
# Contributor network (NetworkX)
# ---------------------------------------------------------------------------

def build_contributor_network(commits: list[dict]) -> list[dict]:
    """
    Two authors are connected if they both modified the same file.
    Returns a list of {source, target, weight, shared_files} edge dicts.
    """
    file_authors: dict[str, set] = defaultdict(set)
    for c in commits:
        for f in c["files_changed"]:
            file_authors[f].add(c["author"])

    G = nx.Graph()
    shared: dict[tuple, dict] = defaultdict(lambda: {"weight": 0, "files": []})

    for filepath, authors in file_authors.items():
        author_list = list(authors)
        for i in range(len(author_list)):
            for j in range(i + 1, len(author_list)):
                key = tuple(sorted([author_list[i], author_list[j]]))
                shared[key]["weight"] += 1
                shared[key]["files"].append(filepath)

    edges = []
    for (src, tgt), data in shared.items():
        G.add_edge(src, tgt, weight=data["weight"])
        edges.append(
            {
                "source": src,
                "target": tgt,
                "weight": data["weight"],
                "shared_files": data["files"][:5],  # top 5 for response size
            }
        )

    edges.sort(key=lambda e: e["weight"], reverse=True)
    return edges[:100]


# ---------------------------------------------------------------------------
# Activity calendar (GitHub contribution-graph style)
# ---------------------------------------------------------------------------

def build_activity_calendar(commits: list[dict]) -> list[dict]:
    day_author_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for c in commits:
        day = c["date_obj"].strftime("%Y-%m-%d")
        day_author_counts[day][c["author"]] += 1

    calendar = []
    for day, authors in sorted(day_author_counts.items()):
        total = sum(authors.values())
        calendar.append(
            {
            "date": day,
            "week": datetime.strptime(day, "%Y-%m-%d").isocalendar().week,
            "weekday": datetime.strptime(day, "%Y-%m-%d").weekday(),
            "total_commits": total,
            "authors": dict(authors),
            "intensity": min(4, int(math.log2(total + 1))),
            }
        )
    return calendar


# ---------------------------------------------------------------------------
# Hotspots
# ---------------------------------------------------------------------------

def build_hotspots(file_churn: list[dict]) -> list[dict]:
    """
    Files with high churn AND multiple contributors are high-risk hotspots.
    """
    if not file_churn:
        return []

    max_churn = max((f["churn"] for f in file_churn), default=1) or 1
    max_contribs = max((f["contributor_count"] for f in file_churn), default=1) or 1

    hotspots = []
    for f in file_churn:
        churn_score = f["churn"] / max_churn
        contrib_score = f["contributor_count"] / max_contribs
        hotspot_score = round((churn_score * 0.6 + contrib_score * 0.4) * 100, 2)

        if hotspot_score > 30:
            hotspots.append(
                {
                    "file": f["file"],
                    "hotspot_score": hotspot_score,
                    "churn": f["churn"],
                    "contributor_count": f["contributor_count"],
                    "contributors": f["contributors"],
                    "commits": f["commits"],
                }
            )

    hotspots.sort(key=lambda h: h["hotspot_score"], reverse=True)
    return hotspots[:50]


# ---------------------------------------------------------------------------
# Risk scores per file
# ---------------------------------------------------------------------------

def build_risk_scores(file_churn: list[dict], commits: list[dict]) -> list[dict]:
    """
    Risk = f(churn, contributor count, recent activity, file type).
    """
    now = datetime.now(tz=timezone.utc)

    # Recent activity lookup per file
    recent_activity: dict[str, int] = defaultdict(int)
    for c in commits:
        days_ago = (now - c["date_obj"]).days
        if days_ago <= 30:
            for f in c["files_changed"]:
                recent_activity[f] += 1

    RISKY_EXTENSIONS = {".js", ".ts", ".py", ".go", ".java", ".c", ".cpp", ".rs", ".rb", ".php"}

    if not file_churn:
        return []

    max_churn = max((f["churn"] for f in file_churn), default=1) or 1
    max_commits = max((f["commits"] for f in file_churn), default=1) or 1
    max_contribs = max((f["contributor_count"] for f in file_churn), default=1) or 1

    result = []
    for f in file_churn:
        ext = "." + f["file"].rsplit(".", 1)[-1].lower() if "." in f["file"] else ""
        ext_multiplier = 1.2 if ext in RISKY_EXTENSIONS else 1.0

        churn_norm = f["churn"] / max_churn
        commit_norm = f["commits"] / max_commits
        contrib_norm = f["contributor_count"] / max_contribs
        recent_norm = min(1.0, recent_activity.get(f["file"], 0) / 10)

        raw = (churn_norm * 0.35 + commit_norm * 0.25 + contrib_norm * 0.25 + recent_norm * 0.15)
        risk = round(min(100.0, raw * 100 * ext_multiplier), 2)

        level = "low"
        if risk >= 70:
            level = "critical"
        elif risk >= 45:
            level = "high"
        elif risk >= 20:
            level = "medium"

        result.append(
            {
                "file": f["file"],
                "risk_score": risk,
                "risk_level": level,
                "churn": f["churn"],
                "recent_commits_30d": recent_activity.get(f["file"], 0),
                "contributor_count": f["contributor_count"],
            }
        )

    result.sort(key=lambda x: x["risk_score"], reverse=True)
    return result[:100]


# ---------------------------------------------------------------------------
# Project growth metrics
# ---------------------------------------------------------------------------

def build_growth_metrics(commits: list[dict], timeline: list[dict]) -> dict:
    if not commits:
        return {}

    oldest = commits[-1]["date_obj"]
    newest = commits[0]["date_obj"]
    span_days = max((newest - oldest).days, 1)

    total_additions = sum(c["lines_added"] for c in commits)
    total_deletions = sum(c["lines_deleted"] for c in commits)

    # Momentum: commits in last 30 days vs 30-60 days
    now = datetime.now(tz=timezone.utc)
    last_30 = sum(1 for c in commits if (now - c["date_obj"]).days <= 30)
    prev_30 = sum(1 for c in commits if 30 < (now - c["date_obj"]).days <= 60)

    momentum = "stable"
    if prev_30 == 0 and last_30 > 0:
        momentum = "growing"
    elif last_30 > prev_30 * 1.2:
        momentum = "growing"
    elif last_30 < prev_30 * 0.8:
        momentum = "declining"

    # Peak day
    peak = max(timeline, key=lambda d: d["commits"]) if timeline else {}

    return {
        "total_commits": len(commits),
        "span_days": span_days,
        "commits_per_day_avg": round(len(commits) / span_days, 3),
        "total_lines_added": total_additions,
        "total_lines_deleted": total_deletions,
        "net_lines": total_additions - total_deletions,
        "commits_last_30d": last_30,
        "commits_prev_30d": prev_30,
        "momentum": momentum,
        "peak_day": peak.get("date", ""),
        "peak_day_commits": peak.get("commits", 0),
        "first_commit": oldest.isoformat(),
        "latest_commit": newest.isoformat(),
    }


# ---------------------------------------------------------------------------
# Health score
# ---------------------------------------------------------------------------

def compute_health_score(
    commits: list[dict],
    contributors: list[dict],
    hotspots: list[dict],
    growth: dict,
) -> tuple[int, list[str]]:
    """
    Returns (score 0-100, list of factor explanations).
    """
    if not commits:
        return 0, ["No commits found – repository may be empty."]

    score = 100.0
    factors: list[str] = []

    # --- Recency (up to -30)
    now = datetime.now(tz=timezone.utc)
    days_since = (now - commits[0]["date_obj"]).days
    if days_since > 365:
        penalty = 30
        score -= penalty
        factors.append(f"Last commit was {days_since} days ago (-{penalty} pts: stale project)")
    elif days_since > 90:
        penalty = 15
        score -= penalty
        factors.append(f"Last commit was {days_since} days ago (-{penalty} pts: low recent activity)")
    else:
        factors.append(f"Recent activity: last commit {days_since} days ago (+0 pts)")

    # --- Bus factor (up to -20)
    total = len(commits) or 1
    top_author_share = contributors[0]["commit_share_pct"] if contributors else 100
    if top_author_share > 80:
        penalty = 20
        score -= penalty
        factors.append(f"Bus factor risk: top author owns {top_author_share}% of commits (-{penalty} pts)")
    elif top_author_share > 60:
        penalty = 10
        score -= penalty
        factors.append(f"Moderate bus factor: top author owns {top_author_share}% of commits (-{penalty} pts)")
    else:
        factors.append(f"Healthy bus factor: top author owns {top_author_share}% of commits (+0 pts)")

    # --- Churn ratio (up to -20)
    net = growth.get("net_lines", 0)
    added = growth.get("total_lines_added", 1) or 1
    churn_ratio = 1 - (net / added) if net >= 0 else 1.0
    if churn_ratio > 0.85:
        penalty = 20
        score -= penalty
        factors.append(f"Very high code churn ratio ({churn_ratio:.0%}) (-{penalty} pts)")
    elif churn_ratio > 0.6:
        penalty = 10
        score -= penalty
        factors.append(f"Moderate code churn ratio ({churn_ratio:.0%}) (-{penalty} pts)")
    else:
        factors.append(f"Healthy churn ratio ({churn_ratio:.0%}) (+0 pts)")

    # --- Hotspots (up to -15)
    critical_hotspots = sum(1 for h in hotspots if h["hotspot_score"] > 70)
    if critical_hotspots > 5:
        penalty = 15
        score -= penalty
        factors.append(f"{critical_hotspots} critical hotspot files (-{penalty} pts)")
    elif critical_hotspots > 0:
        penalty = 7
        score -= penalty
        factors.append(f"{critical_hotspots} hotspot files detected (-{penalty} pts)")
    else:
        factors.append("No critical hotspots (+0 pts)")

    # --- Momentum (up to -15)
    momentum = growth.get("momentum", "stable")
    if momentum == "declining":
        penalty = 15
        score -= penalty
        factors.append(f"Declining commit momentum (-{penalty} pts)")
    elif momentum == "growing":
        factors.append("Growing commit momentum (+0 pts)")
    else:
        factors.append("Stable commit momentum (+0 pts)")

    final = max(0, min(100, round(score)))
    return final, factors


# ---------------------------------------------------------------------------
# Textual insights (rule-based AI-like)
# ---------------------------------------------------------------------------

def generate_insights(
    commits: list[dict],
    contributors: list[dict],
    hotspots: list[dict],
    growth: dict,
    health_score: int,
    branches: list[dict],
    file_churn: list[dict],
) -> list[str]:
    insights: list[str] = []
    now = datetime.now(tz=timezone.utc)

    if not commits:
        return ["Repository appears to be empty or could not be parsed."]

    # --- Project age
    span = growth.get("span_days", 0)
    if span < 7:
        insights.append("🆕 This is a very new project – less than a week of history.")
    elif span < 90:
        insights.append(f"📅 Project is {span} days old – still in early stages.")
    elif span > 365 * 3:
        insights.append(f"🏛️ Mature project with {span // 365} years of history.")
    else:
        insights.append(f"📆 Project has {span} days (~{span // 30} months) of recorded history.")

    # --- Team size
    n_contributors = len(contributors)
    if n_contributors == 1:
        insights.append("👤 Solo project – single contributor detected.")
    elif n_contributors <= 3:
        insights.append(f"👥 Small team of {n_contributors} contributors.")
    elif n_contributors <= 10:
        insights.append(f"🏢 Medium-sized team with {n_contributors} contributors.")
    else:
        insights.append(f"🌐 Large open-source style project with {n_contributors} contributors.")

    # --- Bus factor
    if contributors:
        top = contributors[0]
        if top["commit_share_pct"] > 80:
            insights.append(
                f"⚠️ Bus factor alert: '{top['author']}' is responsible for "
                f"{top['commit_share_pct']}% of all commits. High key-person risk."
            )
        elif top["commit_share_pct"] > 60:
            insights.append(
                f"⚡ '{top['author']}' is the dominant contributor ({top['commit_share_pct']}% of commits)."
            )

    # --- Momentum
    momentum = growth.get("momentum", "stable")
    last_30 = growth.get("commits_last_30d", 0)
    prev_30 = growth.get("commits_prev_30d", 0)
    if momentum == "growing":
        insights.append(
            f"📈 Project is accelerating: {last_30} commits in the last 30 days vs {prev_30} in the prior period."
        )
    elif momentum == "declining":
        insights.append(
            f"📉 Commit velocity is declining: {last_30} commits (last 30d) vs {prev_30} (prior 30d)."
        )
    else:
        insights.append(f"➡️ Steady development pace: ~{last_30} commits in the past 30 days.")

    # --- Hottest file
    if hotspots:
        h = hotspots[0]
        insights.append(
            f"🔥 Hottest file: '{h['file']}' with {h['commits']} commits, "
            f"{h['contributor_count']} contributors and a hotspot score of {h['hotspot_score']}."
        )

    # --- Code growth
    net = growth.get("net_lines", 0)
    if net > 100_000:
        insights.append(f"📦 Substantial codebase: +{net:,} net lines of code.")
    elif net < 0:
        insights.append(f"🧹 Net negative growth ({net:,} lines) – significant refactoring or cleanup detected.")

    # --- Branch info
    n_branches = len(branches)
    if n_branches > 20:
        insights.append(f"🌿 {n_branches} branches detected – consider cleaning up stale branches.")
    elif n_branches > 1:
        insights.append(f"🌿 {n_branches} branches in use.")

    # --- Health summary
    if health_score >= 80:
        insights.append(f"✅ Overall project health is excellent ({health_score}/100).")
    elif health_score >= 60:
        insights.append(f"🟡 Project health is moderate ({health_score}/100) – some areas need attention.")
    else:
        insights.append(f"🔴 Project health is low ({health_score}/100) – multiple risk factors present.")

    # --- Stale check
    days_since = (now - commits[0]["date_obj"]).days
    if days_since > 180:
        insights.append(f"😴 No commits in {days_since} days – project may be abandoned or maintenance-only.")

    # --- Peak activity
    peak = growth.get("peak_day", "")
    peak_commits = growth.get("peak_day_commits", 0)
    if peak and peak_commits > 5:
        insights.append(f"⚡ Peak activity was on {peak} with {peak_commits} commits in a single day.")

    return insights


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def analyze_repository(repo, max_commits: int = 2000) -> dict[str, Any]:
    commits = extract_commits(repo, max_commits=max_commits)
    branches = extract_branches(repo)
    branch_relations = build_branch_relations(repo, branches)
    timeline = build_timeline(commits)
    file_churn = build_file_churn(commits)
    contributors = build_contributor_stats(commits)
    contributor_network = build_contributor_network(commits)
    activity_calendar = build_activity_calendar(commits)
    hotspots = build_hotspots(file_churn)
    risk_scores = build_risk_scores(file_churn, commits)
    growth = build_growth_metrics(commits, timeline)
    health_score, health_factors = compute_health_score(commits, contributors, hotspots, growth)
    insights = generate_insights(commits, contributors, hotspots, growth, health_score, branches, file_churn)

    # Strip internal date objects before returning
    for c in commits:
        c.pop("date_obj", None)

    # Build contributor_file_map for frontends that need it
    contrib_file_map = build_contributor_file_map(commits)

    # Normalise contributor_network: add id/label fields some frontends expect
    network_nodes = []
    seen_nodes: set[str] = set()
    for edge in contributor_network:
        for name in (edge["source"], edge["target"]):
            if name not in seen_nodes:
                seen_nodes.add(name)
                network_nodes.append({"id": name, "label": name, "name": name})
    # Add solo contributors who have no edges
    for c in contributors:
        if c["author"] not in seen_nodes:
            seen_nodes.add(c["author"])
            network_nodes.append({"id": c["author"], "label": c["author"], "name": c["author"]})

    # Enrich edges with source/target aliases
    network_edges = [
        {
            **edge,
            "from": edge["source"],
            "to": edge["target"],
            "value": edge["weight"],
        }
        for edge in contributor_network
    ]

    # Enrich file_churn with name alias (some frontends use .name not .file)
    enriched_churn = [
        {
            **f,    
            "name": f["file"],
            "value": f["change_frequency"]   # heatmap uses frequency
        }
        for f in file_churn
    ]      
    
    
    

    # Enrich hotspots
    enriched_hotspots = [
        {**h, "name": h["file"], "value": h["hotspot_score"], "score": h["hotspot_score"]}
        for h in hotspots
    ]

    # Enrich risk_scores
    enriched_risk = [
        {**r, "name": r["file"], "value": r["risk_score"], "level": r["risk_level"]}
        for r in risk_scores
    ]

    # Enrich contributors with id/name aliases
    enriched_contributors = [
        {
            **c,
            "id": c["author"],
            "name": c["author"],
            "value": c["commits"],
            "additions": c["lines_added"],
            "deletions": c["lines_deleted"],
        }
        for c in contributors
    ]

    # Enrich timeline with count alias
    enriched_timeline = [
        {**t, "count": t["commits"], "value": t["commits"]}
        for t in timeline
    ]

    # Enrich branches with id alias
    enriched_branches = [
        {**b, "id": b["name"], "label": b["name"]}
        for b in branches
    ]

    # Enrich activity_calendar
    enriched_calendar = [
        {
            **day,
            "count": day["total_commits"],
            "value": day["total_commits"],
        }
        for day in activity_calendar
    ]

    return {
        # --- summary block ---
        "summary": {
            "total_commits": len(commits),
            "total_contributors": len(contributors),
            "total_branches": len(branches),
            "total_files_tracked": len(file_churn),
            # aliases
            "commits": len(commits),
            "contributors": len(contributors),
            "branches": len(branches),
            "files": len(file_churn),
        },
        # --- core arrays (enriched) ---
        "timeline": enriched_timeline,
        "file_churn": enriched_churn,
        "contributors": enriched_contributors,
        "contributor_network": contributor_network,          # original
        "contributor_network_nodes": network_nodes,          # graph nodes
        "contributor_network_edges": network_edges,          # graph edges (with from/to)
        "contributor_file_map": contrib_file_map,
        "activity_calendar": enriched_calendar,
        "branches": enriched_branches,
        "branch_relations": branch_relations,
        "hotspots": enriched_hotspots,
        "risk_scores": enriched_risk,
        "growth_metrics": growth,
        # --- scalar scores ---
        "health_score": health_score,
        "health_factors": health_factors,
        "insights": insights,
        # --- commit preview ---
        "recent_commits": commits[:20],
        "commits": commits[:50],          # alias used by some frontends
    }