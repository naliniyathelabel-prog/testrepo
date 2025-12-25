  """Mobile UX fixes as a reusable tool.

  Applies the same surgical edits we tested manually:
  - viewport interactive-widget
  - 100vh → 100dvh
  - safe-area bottom for input
  - semi-transparent header with blur
  """

  from __future__ import annotations

  import re
  from pathlib import Path


  def apply_mobile_fixes(root: Path) -> None:
      index_html = root / "index.html"
      css_file = root / "src" / "App.css"

      if index_html.exists():
          text = index_html.read_text(encoding="utf-8")
          if "interactive-widget" not in text:
              text = text.replace(
                  'content="width=device-width, initial-scale=1.0"',
                  'content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"',
              )
              index_html.write_text(text, encoding="utf-8")

      if css_file.exists():
          css = css_file.read_text(encoding="utf-8")

          # 100vh → 100dvh on .app
          css = re.sub(
              r"(\.app\s*{[^}]*height:)\s*100vh",
              r" 100dvh",
              css,
          )

          # header transparency + blur
          css = css.replace(
              "background: rgba(255, 255, 255, 0.9);",
              "background: rgba(255, 255, 255, 0.85);",
          )
          if "-webkit-backdrop-filter" not in css:
              css = css.replace(
                  "backdrop-filter: blur(10px);",
                  "backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);",
              )

          # safe area bottom for input container
          css = css.replace(
              "bottom: 0;",
              "bottom: env(safe-area-inset-bottom, 0px);",
              1,
          )

          css_file.write_text(css, encoding="utf-8")
