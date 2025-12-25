"""Mobile UX fixes as a reusable tool.

Applies the same surgical edits we tested manually:
- viewport interactive-widget
- 100vh → 100dvh
- safe-area bottom for input
- semi-transparent header with blur

⚠️  Do NOT run this file directly. Use:
    python -m tools.orchestrator --use mobile-fix
"""

from __future__ import annotations

import re
from pathlib import Path


def apply_mobile_fixes(root: Path) -> None:
    """Apply mobile keyboard and UI fixes to index.html and App.css."""

    index_html = root / "index.html"
    css_file = root / "src" / "App.css"
    changes = []

    if index_html.exists():
        text = index_html.read_text(encoding="utf-8")
        if "interactive-widget" not in text:
            text = text.replace(
                'content="width=device-width, initial-scale=1.0"',
                'content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"',
            )
            index_html.write_text(text, encoding="utf-8")
            changes.append("viewport meta (interactive-widget)")

    if css_file.exists():
        css = css_file.read_text(encoding="utf-8")

        # 100vh → 100dvh on .app
        if "100vh" in css:
            css = re.sub(
                r"(\.app\s*{[^}]*height:)\s*100vh",
                r"\1 100dvh",
                css,
            )
            changes.append(".app height (100dvh)")

        # header transparency + blur
        if "rgba(255, 255, 255, 0.9)" in css:
            css = css.replace(
                "background: rgba(255, 255, 255, 0.9);",
                "background: rgba(255, 255, 255, 0.85);",
            )
            changes.append("header transparency")

        if "-webkit-backdrop-filter" not in css:
            css = css.replace(
                "backdrop-filter: blur(10px);",
                "backdrop-filter: blur(10px);\n  -webkit-backdrop-filter: blur(10px);",
            )
            changes.append("webkit backdrop filter")

        # safe area bottom for input container
        if "env(safe-area-inset-bottom" not in css:
            css = css.replace(
                "bottom: 0;",
                "bottom: env(safe-area-inset-bottom, 0px);",
                1,
            )
            changes.append("safe-area-inset-bottom")

        css_file.write_text(css, encoding="utf-8")

    if changes:
        print("Applied fixes:")
        for c in changes:
            print(f"  ✓ {c}")
    else:
        print("✓ No changes needed (already applied)")
