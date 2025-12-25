    """Aider-style repomap generator for Flonest Chat.

    Extracts key symbols (components, functions, hooks) from the React
    frontend and writes AIDER_REPOMAP.md. This is intentionally light-weight
    and safe to call from CI or LLM agents.
    """

    from __future__ import annotations

    import re
    from pathlib import Path
    from typing import Dict, List


    def _extract_symbols(path: Path, text: str) -> Dict[str, List[str]]:
        symbols = {"components": [], "functions": [], "hooks": [], "exports": []}
        lines = text.split("
")

        for i, line in enumerate(lines, 1):
            s = line.strip()

            # function Foo() {}
            if s.startswith("function "):
                m = re.match(r"function\s+(\w+)", s)
                if m:
                    name = m.group(1)
                    bucket = "components" if name[0].isupper() else "functions"
                    symbols[bucket].append(f"{name}() @L{i}")

            # const Foo = () => {}
            if s.startswith("const ") or s.startswith("export const"):
                if "=>" in s:
                    m = re.match(r"(?:export\s+)?const\s+(\w+)", s)
                    if m:
                        name = m.group(1)
                        bucket = "components" if name[0].isupper() else "functions"
                        symbols[bucket].append(f"{name}() @L{i}")

            # basic hooks pattern
            if "useState(" in s or "useEffect(" in s or "useRef(" in s:
                symbols["hooks"].append(f"hook @L{i}")

            if s.startswith("export "):
                symbols["exports"].append(f"export @L{i}")

        return symbols


    def generate_repomap(root: Path) -> None:
        src = root / "src"
        files = [src / "App.jsx", src / "embeddings.js", src / "db.js", src / "App.css"]

        out = ["# 🗺️ AIDER-STYLE REPOMAP", ""]

        for fp in files:
            if not fp.exists():
                continue
            text = fp.read_text(encoding="utf-8")
            out.append(f"## {fp.as_posix()}")

            if fp.suffix in {".js", ".jsx"}:
                syms = _extract_symbols(fp, text)
                for key in ("components", "functions", "hooks", "exports"):
                    if syms[key]:
                        label = key.capitalize()
                        out.append(f"- {label}: " + ", ".join(syms[key]))

            if fp.suffix == ".css":
                classes = sorted(set(re.findall(r"\.([a-zA-Z0-9_-]+)\s*{", text)))
                if classes:
                    out.append("- Classes: " + ", ".join(classes[:30]))

            out.append("")

        (root / "AIDER_REPOMAP.md").write_text("
".join(out), encoding="utf-8")


    if __name__ == "__main__":  # manual run
        generate_repomap(Path("."))
