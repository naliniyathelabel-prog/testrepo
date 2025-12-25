"""Orchestrator for Flonest tooling.

This module provides a single entrypoint which can call multiple
repo tools (repomap generation, mobile fixes, semantic audits, etc.).
It is designed to be simple to call from CI, shell scripts, or LLM agents.
"""

import argparse
from pathlib import Path

from tools import repomap, mobile_fix


def list_tools() -> None:
    """Print available tools and their summaries.

    Default behavior when no explicit tool is passed.
    Safe to call from an LLM to discover capabilities.
    """

    tools = {
        "repomap": "Generate/update AIDER_REPOMAP.md with components, functions, hooks, CSS classes.",
        "mobile-fix": "Apply mobile UX fixes (viewport, 100dvh, safe-area, header blur).",
    }
    print("Available tools:
")
    for name, desc in tools.items():
        print(f"- {name}: {desc}")


def run_repomap(root: Path) -> None:
    """Generate/update AIDER-style repomap files under the repo."""

    repomap.generate_repomap(root)


def run_mobile_fix(root: Path) -> None:
    """Apply surgical mobile UX fixes (keyboard + header)."""

    mobile_fix.apply_mobile_fixes(root)


def main() -> None:
    parser = argparse.ArgumentParser(description="Flonest tools orchestrator", add_help=True)
    parser.add_argument("tool", nargs="?", help="Which tool to run (default: list tools)")
    parser.add_argument("--root", default=".", help="Repo root path (default: current directory)")
    args = parser.parse_args()

    root = Path(args.root).resolve()

    if not args.tool:
        list_tools()
        return

    if args.tool == "repomap":
        run_repomap(root)
    elif args.tool == "mobile-fix":
        run_mobile_fix(root)
    else:
        print(f"Unknown tool: {args.tool}")
        list_tools()


if __name__ == "__main__":
    main()
