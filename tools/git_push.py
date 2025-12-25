"""Git push automation tool.

Commits and pushes changes to the current branch with proper security handling.

⚠️  Do NOT run this file directly. Use:
    python -m tools.orchestrator --use git-push

Security:
- Reads GitHub PAT from environment variable GITHUB_PAT
- Never hardcodes credentials
- Falls back to existing git config if PAT not provided
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def git_push(root: Path, message: str = "Auto-commit via tools") -> None:
    """Stage, commit, and push changes to current branch.

    Args:
        root: Repository root path
        message: Commit message (default: "Auto-commit via tools")

    Environment:
        GITHUB_PAT: GitHub Personal Access Token (optional, uses existing auth if not set)

    Raises:
        SystemExit: If git operations fail
    """

    os.chdir(root)

    # Check if we're in a git repo
    result = subprocess.run(["git", "rev-parse", "--git-dir"], 
                          capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Not a git repository")
        sys.exit(1)

    # Get current branch
    branch_result = subprocess.run(["git", "branch", "--show-current"],
                                  capture_output=True, text=True, check=True)
    current_branch = branch_result.stdout.strip()

    if not current_branch:
        print("❌ Not on any branch (detached HEAD)")
        sys.exit(1)

    print(f"📍 Branch: {current_branch}")

    # Check for changes
    status_result = subprocess.run(["git", "status", "--porcelain"],
                                  capture_output=True, text=True, check=True)

    if not status_result.stdout.strip():
        print("✓ No changes to commit")
        return

    print("\n📝 Changes detected:")
    print(status_result.stdout)

    # Stage all changes
    subprocess.run(["git", "add", "."], check=True)
    print("✓ Staged changes")

    # Commit
    subprocess.run(["git", "commit", "-m", message], check=True)
    print(f"✓ Committed: {message}")

    # Push (with PAT if provided)
    pat = os.getenv("GITHUB_PAT")

    if pat:
        # Get remote URL
        remote_result = subprocess.run(["git", "remote", "get-url", "origin"],
                                      capture_output=True, text=True, check=True)
        remote_url = remote_result.stdout.strip()

        # Replace with authenticated URL
        if "github.com" in remote_url:
            if remote_url.startswith("https://"):
                # Extract repo path
                repo_path = remote_url.replace("https://github.com/", "")
                auth_url = f"https://x-access-token:{pat}@github.com/{repo_path}"
            else:
                print("⚠️  Non-HTTPS remote, using existing auth")
                auth_url = None
        else:
            auth_url = None

        if auth_url:
            subprocess.run(["git", "push", auth_url, current_branch], check=True)
        else:
            subprocess.run(["git", "push", "origin", current_branch], check=True)
    else:
        # Use existing git credentials
        print("💡 GITHUB_PAT not set, using existing git auth")
        subprocess.run(["git", "push", "origin", current_branch], check=True)

    print(f"✅ Pushed to origin/{current_branch}")
