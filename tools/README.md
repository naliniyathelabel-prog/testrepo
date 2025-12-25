# Flonest Tools

Python tools to automate common repo operations.

## Layout

- `orchestrator.py` – single entrypoint that wires all tools
- `repomap.py` – generate/update `AIDER_REPOMAP.md` with key symbols
- `mobile_fix.py` – apply mobile keyboard + header fixes

## Usage

From repo root:

```bash
# Generate / refresh repomap
python -m tools.orchestrator repomap

# Re-apply mobile fixes if CSS/HTML change
python -m tools.orchestrator mobile-fix
```

These scripts are safe for CI pipelines and for LLM agents to call as
utilities when reasoning about or editing the codebase.
