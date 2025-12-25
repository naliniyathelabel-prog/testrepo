"""Orchestrator for Flonest tooling.

This module provides a single entrypoint which can call multiple
repo tools (repomap generation, mobile fixes, semantic audits, etc.).
It is designed to be simple to call from CI, shell scripts, or LLM agents.
"""

import argparse
from pathlib import Path

from tools import repomap, mobile_fix


def run_repomap(root: Path) -> None:
    """Generate/update AIDER-style repomap files under the repo.

    - Scans src/ for JS/JSX modules
    - Extracts components, functions, hooks
    - Writes AIDER_REPOMAP.md
    """

    repomap.generate_repomap(root)


def run_mobile_fix(root: Path) -> None:
    """Apply surgical mobile UX fixes.

    - Ensures viewport meta has interactive-widget=resizes-content
    - Uses 100dvh instead of 100vh for the main app container
    - Applies safe-area-inset-bottom to the chat input container
    - Makes header semi-transparent with blur
    """

    mobile_fix.apply_mobile_fixes(root)


def main() -> None:
    parser = argparse.ArgumentParser(description="Flonest tools orchestrator")
    parser.add_argument("tool", choices=["repomap", "mobile-fix"], help="Which tool to run")
    parser.add_argument("--root", default=".", help="Repo root path (default: current directory)")
    args = parser.parse_args()

    root = Path(args.root).resolve()

    if args.tool == "repomap":
        run_repomap(root)
    elif args.tool == "mobile-fix":
        run_mobile_fix(root)


if __name__ == "__main__":
    main()
