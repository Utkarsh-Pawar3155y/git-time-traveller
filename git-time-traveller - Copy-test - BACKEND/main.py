"""
main.py
Git History Time Traveller – FastAPI Backend
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
import time
import re
from pathlib import Path
from typing import Any, Optional

import git
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

from utils.git_parser import analyze_repository

# Logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("git-time-traveller")

# App setup

app = FastAPI(
    title="Git History Time Traveller",
    description="Visualize and analyse any public GitHub repository's full history.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request / response models

ALLOWED_HOSTS_RE = re.compile(
    r"^https?://(github\.com|gitlab\.com|bitbucket\.org|codeberg\.org)/[\w.@:/\-]+/?$",
    re.IGNORECASE,
)


class AnalyzeRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = None  # optional: clone specific branch
    max_commits: Optional[int] = None  # optional: limit commits (for demo speed)
    range_days: Optional[int] = None

    @field_validator("repo_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        # Ensure .git suffix for cloning
        if not v.endswith(".git"):
            v = v + ".git"
        if not ALLOWED_HOSTS_RE.match(v.rstrip(".git") + ""):
            # Re-check without .git
            if not ALLOWED_HOSTS_RE.match(v[:-4] if v.endswith(".git") else v):
                raise ValueError(
                    "URL must be a valid GitHub, GitLab, Bitbucket or Codeberg repository URL."
                )
        return v


# Helpers

def _clone_repo(url: str, target_dir: str, branch: Optional[str] = None) -> git.Repo:
    """Clone with shallow + blobless options for maximum speed."""
    multi_opts = [
        "--depth=1500"
        "--no-single-branch"
    ]
    clone_kwargs: dict[str, Any] = {
        "url": url,
        "to_path": target_dir,
        "multi_options": multi_opts,
    }
    if branch:
        clone_kwargs["branch"] = branch

    try:
        repo = git.Repo.clone_from(**clone_kwargs)
        return repo
    except Exception:
        # Fallback: plain clone, no options
        shutil.rmtree(target_dir, ignore_errors=True)
        os.makedirs(target_dir, exist_ok=True)
        return git.Repo.clone_from(url=url, to_path=target_dir)


def _safe_remove(path: str) -> None:
    """Remove temp directory, tolerating errors (Windows lock, perms, etc.)."""
    try:
        shutil.rmtree(path, ignore_errors=True)
    except Exception as exc:
        logger.warning("Could not remove temp dir %s: %s", path, exc)


# Middleware – request timing

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = round(time.perf_counter() - start, 3)
    response.headers["X-Process-Time"] = str(elapsed)
    return response


# Global exception handler

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s", request.url)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# Endpoints

@app.get("/health", tags=["Meta"])
def health_check():
    """Simple liveness probe."""
    return {
        "status": "ok",
        "service": "Git History Time Traveller",
        "version": "1.0.0",
    }


@app.get("/", tags=["Meta"])
def root():
    return {
        "message": "Git History Time Traveller API",
        "docs": "/docs",
        "health": "/health",
        "analyze": "POST /analyze",
    }


@app.post("/analyze", tags=["Analysis"])
def analyze(body: AnalyzeRequest):
    """
    Clone a repository and return full analytics.

    - **repo_url**: Public git repository URL (GitHub, GitLab, Bitbucket, Codeberg)
    - **branch**: (optional) specific branch to analyse
    - **max_commits**: (optional) limit number of commits for faster demo responses
    """
    repo_url = body.repo_url
    tmp_dir: Optional[str] = None

    try:
        logger.info("Starting analysis for: %s", repo_url)
        t0 = time.perf_counter()

        # Create isolated temp directory
        tmp_dir = tempfile.mkdtemp(prefix="git_tt_")
        clone_target = os.path.join(tmp_dir, "repo")

        # Clone
        logger.info("Cloning into %s …", clone_target)
        try:
            repo = _clone_repo(repo_url, clone_target, branch=body.branch)
        except git.exc.GitCommandError as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to clone repository: {exc.stderr.strip() if exc.stderr else str(exc)}",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Clone error: {str(exc)}",
            )

        clone_time = round(time.perf_counter() - t0, 2)
        logger.info("Clone completed in %.2fs", clone_time)

        # Analyse
        try:
            logger.info("Running git log analysis (max 2000 commits, 60s timeout)…")
            result = analyze_repository(
            repo,
            max_commits=2000,
            range_days=body.range_days
        )       
        except Exception as exc:
            logger.exception("Analysis failed")
            raise HTTPException(
                status_code=500,
                detail=f"Analysis error: {str(exc)}",
            )

        analysis_time = round(time.perf_counter() - t0 - clone_time, 2)
        logger.info(
            "Analysis completed in %.2fs (clone: %.2fs)",
            analysis_time,
            clone_time,
        )

        result["meta"] = {
            "repo_url": repo_url,
            "clone_time_seconds": clone_time,
            "analysis_time_seconds": analysis_time,
            "total_time_seconds": round(clone_time + analysis_time, 2),
        }

        return result

    finally:
        # Always clean up
        if tmp_dir:
            logger.info("Cleaning up temp dir: %s", tmp_dir)
            _safe_remove(tmp_dir)


# Entry point

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )