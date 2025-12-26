"""Git push tool with Cloudflare auth proxy integration.

Automatically pushes changes to remote using GitHub PAT from auth proxy.
Integrates with three-layer identity system (internal ID, Telegram, GitHub).
"""

import subprocess
import sys
import requests
from pathlib import Path
from urllib.parse import urlparse
import time


PROXY_URL = "https://auth-proxy.finetunetech-e.workers.dev"


def get_git_remote_url(root: Path) -> str:
    """Get the git remote URL."""
    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=root,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise Exception("Failed to get git remote URL. Is this a git repo?")
    return result.stdout.strip()


def extract_github_username(remote_url: str) -> str:
    """Extract GitHub username/owner from remote URL."""
    # Handle both HTTPS and SSH formats
    # https://github.com/username/repo.git
    # git@github.com:username/repo.git

    if remote_url.startswith("git@"):
        # SSH format: git@github.com:username/repo.git
        parts = remote_url.split(":")
        if len(parts) == 2:
            repo_path = parts[1].replace(".git", "")
            return repo_path.split("/")[0]
    else:
        # HTTPS format
        parsed = urlparse(remote_url)
        path_parts = parsed.path.strip("/").replace(".git", "").split("/")
        if len(path_parts) >= 1:
            return path_parts[0]

    raise Exception(f"Could not extract username from remote URL: {remote_url}")


def check_has_pat(github_username: str) -> bool:
    """Check if user has GitHub PAT via auth proxy."""
    try:
        resp = requests.get(
            f"{PROXY_URL}/user/{github_username}/has-github-pat",
            timeout=10
        )
        if resp.status_code == 200:
            return resp.json().get("has_pat", False)
        return False
    except Exception as e:
        print(f"Error checking PAT status: {e}")
        return False


def request_authorization(github_username: str) -> bool:
    """Request authorization via Telegram bot."""
    try:
        resp = requests.post(
            f"{PROXY_URL}/notify/authorize",
            json={"user_id": github_username},
            timeout=10
        )

        if resp.status_code == 404:
            data = resp.json()
            if data.get("status") == "not_registered":
                print(f"\n{data.get('message', 'Not registered')}")
                print(f"\n{data.get('bot_url', 'Register via Telegram')}")
                if "instructions" in data:
                    print("\nSteps:")
                    for instruction in data["instructions"]:
                        print(f"   {instruction}")
                return False

        if resp.status_code == 200:
            print(f"\nAuthorization request sent!")
            print("Check your Telegram for the authorization link.")
            return True

        print(f"\nAuthorization request failed: {resp.text}")
        return False

    except Exception as e:
        print(f"Error requesting authorization: {e}")
        return False


def wait_for_authorization(github_username: str, max_wait: int = 120) -> bool:
    """Poll for authorization completion."""
    print(f"\nWaiting for authorization (up to {max_wait}s)...")
    print("   Tap the 'Authorize GitHub' button in Telegram when ready.")

    start_time = time.time()
    while (time.time() - start_time) < max_wait:
        if check_has_pat(github_username):
            print("Authorization complete!")
            return True

        # Show progress
        elapsed = int(time.time() - start_time)
        print(f"   Waiting... ({elapsed}s)", end="\r")
        time.sleep(3)

    print("\nAuthorization timeout. Please try again.")
    return False


def get_git_credentials(github_username: str, repo: str) -> dict:
    """Get git credentials from auth proxy."""
    try:
        resp = requests.post(
            f"{PROXY_URL}/github/git-cred",
            json={"repo": repo, "user_id": github_username},
            timeout=10
        )

        if resp.status_code == 200:
            return resp.json()
        else:
            raise Exception(f"Failed to get credentials: {resp.text}")

    except Exception as e:
        raise Exception(f"Error getting credentials: {e}")


def git_push_with_token(root: Path, remote_url: str, token: str) -> bool:
    """Push to remote using authenticated URL."""
    # Parse remote URL to inject token
    if remote_url.startswith("git@"):
        # Convert SSH to HTTPS
        remote_url = remote_url.replace("git@github.com:", "https://github.com/")

    # Remove .git suffix if present
    remote_url = remote_url.replace(".git", "")

    # Inject token into URL: https://x-access-token:TOKEN@github.com/user/repo
    parsed = urlparse(remote_url)
    authenticated_url = f"https://x-access-token:{token}@{parsed.netloc}{parsed.path}.git"

    print(f"\nPushing to remote...")

    # Push using authenticated URL
    result = subprocess.run(
        ["git", "push", authenticated_url, "HEAD"],
        cwd=root,
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        print("Push successful!")
        print(result.stdout)
        return True
    else:
        print(f"Push failed:")
        print(result.stderr)
        return False


def push_to_remote(root: Path) -> None:
    """Main gitpush function - push changes to remote via auth proxy.

    This function:
    1. Extracts GitHub username from git remote URL
    2. Checks if user has linked their GitHub account
    3. Requests authorization via Telegram if needed
    4. Gets GitHub PAT from auth proxy
    5. Pushes changes using authenticated URL
    """
    print("\nGitPush - Secure push via Cloudflare Auth Proxy\n")

    # 1. Get remote URL and extract username
    try:
        remote_url = get_git_remote_url(root)
        github_username = extract_github_username(remote_url)
        print(f"Repository: {remote_url}")
        print(f"GitHub user: {github_username}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    # 2. Check if user has PAT
    print(f"\nChecking authorization status...")
    if not check_has_pat(github_username):
        print(f"GitHub account not authorized")

        # 3. Request authorization
        if not request_authorization(github_username):
            sys.exit(1)

        # 4. Wait for user to complete OAuth
        if not wait_for_authorization(github_username):
            sys.exit(1)
    else:
        print(f"GitHub account authorized")

    # 5. Get credentials
    print(f"\nFetching credentials...")
    try:
        repo_name = "/".join(remote_url.split("/")[-2:]).replace(".git", "")
        creds = get_git_credentials(github_username, repo_name)
        token = creds.get("token")

        if not token:
            print("No token received from auth proxy")
            sys.exit(1)

        print("Credentials received")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    # 6. Push to remote
    if not git_push_with_token(root, remote_url, token):
        sys.exit(1)

    print("\nDone!\n")
