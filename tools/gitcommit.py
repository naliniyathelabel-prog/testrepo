"""Git commit and push tool using orchestrator pattern.

Commits staged changes and pushes using the gitpush tool.
"""

import subprocess
import sys
from pathlib import Path


def commit_and_push(root: Path) -> None:
    """Stage all changes, commit, and push to remote.

    This function:
    1. Stages all modified and new files
    2. Creates a commit with auto-generated message
    3. Uses gitpush tool to push to remote
    """
    print("\nGit Commit and Push\n")

    # 1. Stage all changes
    print("Staging changes...")
    result = subprocess.run(
        ["git", "add", "-A"],
        cwd=root,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error staging files: {result.stderr}")
        sys.exit(1)

    print("Files staged")

    # 2. Check if there are changes to commit
    result = subprocess.run(
        ["git", "diff", "--staged", "--quiet"],
        cwd=root
    )

    if result.returncode == 0:
        print("No changes to commit")
        return

    # 3. Create commit
    print("\nCreating commit...")

    # Generate commit message from git status
    status_result = subprocess.run(
        ["git", "status", "--short"],
        cwd=root,
        capture_output=True,
        text=True
    )

    changes = status_result.stdout.strip().split('\n')

    # Build commit message
    modified_files = []
    new_files = []

    for change in changes:
        if not change.strip():
            continue
        status = change[:2].strip()
        filename = change[3:].strip()

        if 'M' in status:
            modified_files.append(filename)
        elif 'A' in status or '?' in status:
            new_files.append(filename)

    commit_msg_parts = []

    if new_files:
        commit_msg_parts.append(f"Add {', '.join(new_files[:3])}")
        if len(new_files) > 3:
            commit_msg_parts[-1] += f" and {len(new_files) - 3} more"

    if modified_files:
        commit_msg_parts.append(f"Update {', '.join(modified_files[:3])}")
        if len(modified_files) > 3:
            commit_msg_parts[-1] += f" and {len(modified_files) - 3} more"

    commit_message = "; ".join(commit_msg_parts) if commit_msg_parts else "Update files"
    commit_message += "\n\nGenerated with Claude Code\n\nCo-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

    # Create commit
    result = subprocess.run(
        ["git", "commit", "-m", commit_message],
        cwd=root,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error creating commit: {result.stderr}")
        sys.exit(1)

    print(f"Commit created: {commit_message.split(chr(10))[0]}")

    # 4. Push using gitpush tool
    print("\nPushing to remote using gitpush tool...")

    # Import and call gitpush
    from tools.gitpush import push_to_remote
    push_to_remote(root)

    print("\nCommit and push completed!\n")
