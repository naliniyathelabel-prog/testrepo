# Flonest Tools

**Strict orchestrator-only execution pattern.**

All tools in this folder MUST be invoked via `tools/orchestrator.py`.  
Direct execution of `tools/*.py` is **prohibited**.

---

## Usage

### List available tools
```bash
python -m tools.orchestrator
```

### Read a tool (inspect source + capabilities)
```bash
python -m tools.orchestrator --read repomap
python -m tools.orchestrator --read mobile-fix
```

### Execute a tool
```bash
python -m tools.orchestrator --use repomap
python -m tools.orchestrator --use mobile-fix
```

---

## Available Tools

| Tool | Summary |
|------|---------|
| `repomap` | Generate/update AIDER_REPOMAP.md with components, functions, hooks, CSS classes |
| `mobile-fix` | Apply mobile UX fixes (viewport, 100dvh, safe-area, header blur) |

---

## Adding New Tools

1. Create `tools/your_tool.py` with a single public function:
   ```python
   def your_tool_function(root: Path) -> None:
       """Tool summary here."""
       # implementation
   ```

2. Register in `tools/orchestrator.py` TOOLS dict:
   ```python
   "your-tool": {
       "module": "tools.your_tool",
       "function": "your_tool_function",
       "summary": "Brief description",
       "file": "tools/your_tool.py"
   }
   ```

3. Use it:
   ```bash
   python -m tools.orchestrator --use your-tool
   ```

---

## Design Principles

✅ **Single control plane** - All actions via orchestrator  
✅ **LLM-friendly** - Discoverable via --read, safe to automate  
✅ **Version controlled** - Tools evolve with the repo  
✅ **CI/CD ready** - Stable CLI interface  

⛔ **Never** run `python tools/foo.py` directly
