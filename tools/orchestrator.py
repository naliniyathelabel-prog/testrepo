"""Orchestrator for Flonest tooling.

STRICT RULE: All tools MUST be invoked via this orchestrator.
Direct execution of tools/*.py is prohibited.

Usage:
    python -m tools.orchestrator                    # List available tools
    python -m tools.orchestrator --read <tool>      # Read tool source and capabilities
    python -m tools.orchestrator --use <tool>       # Execute a tool

Design:
- Single control plane for all repo operations
- LLM-friendly discovery via --read
- Safe execution via --use
- New tools registered here with name + summary
"""

import argparse
import sys
from pathlib import Path

# Tool registry - add new tools here
TOOLS = {
    "repomap": {
        "module": "tools.repomap",
        "function": "generate_repomap",
        "summary": "Generate/update AIDER_REPOMAP.md with components, functions, hooks, CSS classes",
        "file": "tools/repomap.py"
    },
    "mobile-fix": {
        "module": "tools.mobile_fix",
        "function": "apply_mobile_fixes",
        "summary": "Apply mobile UX fixes (viewport, 100dvh, safe-area, header blur)",
        "file": "tools/mobile_fix.py"
    },
    "gitpush": {
        "module": "tools.gitpush",
        "function": "push_to_remote",
        "summary": "Push changes to remote via Cloudflare auth proxy with GitHub PAT",
        "file": "tools/gitpush.py"
    },
    "gitcommit": {
        "module": "tools.gitcommit",
        "function": "commit_and_push",
        "summary": "Stage all changes, commit, and push to remote using gitpush",
        "file": "tools/gitcommit.py"
    }
}


def list_tools() -> None:
    """Print available tools and their summaries."""
    print("\n📦 Available tools:\n")
    for name, info in TOOLS.items():
        print(f"  {name:15} {info['summary']}")
    print("\n💡 Usage:")
    print("  python -m tools.orchestrator --read <tool>")
    print("  python -m tools.orchestrator --use <tool>\n")


def read_tool(tool_name: str) -> None:
    """Read and display tool source code and metadata."""
    if tool_name not in TOOLS:
        print(f"❌ Unknown tool: {tool_name}")
        list_tools()
        sys.exit(1)

    tool = TOOLS[tool_name]
    print(f"\n🔍 Tool: {tool_name}")
    print(f"Summary: {tool['summary']}")
    print(f"Module: {tool['module']}")
    print(f"Function: {tool['function']}()")
    print(f"\n📄 Source ({tool['file']}):\n")

    tool_path = Path(tool['file'])
    if tool_path.exists():
        print(tool_path.read_text(encoding='utf-8'))
    else:
        print(f"⚠️  File not found: {tool_path}")


def use_tool(tool_name: str, root: Path) -> None:
    """Execute a registered tool."""
    if tool_name not in TOOLS:
        print(f"Unknown tool: {tool_name}")
        list_tools()
        sys.exit(1)

    tool = TOOLS[tool_name]
    print(f"\nExecuting: {tool_name}")
    print(f"   {tool['summary']}\n")

    try:
        # Dynamic import
        parts = tool['module'].split('.')
        module = __import__(tool['module'], fromlist=[parts[-1]])
        func = getattr(module, tool['function'])

        # Execute
        func(root)
        print(f"\n{tool_name} completed successfully\n")

    except Exception as e:
        print(f"\nError executing {tool_name}: {e}\n")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Flonest tools orchestrator - strict single entry point",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m tools.orchestrator              # List tools
  python -m tools.orchestrator --read repomap
  python -m tools.orchestrator --use mobile-fix
        """
    )

    parser.add_argument('--read', metavar='TOOL', help='Read tool source and capabilities')
    parser.add_argument('--use', metavar='TOOL', help='Execute a tool')
    parser.add_argument('--root', default='.', help='Repo root path (default: current dir)')

    args = parser.parse_args()
    root = Path(args.root).resolve()

    if args.read:
        read_tool(args.read)
    elif args.use:
        use_tool(args.use, root)
    else:
        list_tools()


if __name__ == "__main__":
    main()
