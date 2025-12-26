# Enhanced Text Formatting

## Overview
Rich markdown rendering for beautiful message display.

## Supported Markdown

### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
```

### Text Formatting
- **Bold text** with `**bold**`
- *Italic text* with `*italic*`
- `Inline code` with backticks
- [Links](url) with `[text](url)`

### Lists
```markdown
- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2
```

### Code Blocks
\`\`\`javascript
function hello() {
  console.log("Hello!");
}
\`\`\`

### Quotes
```markdown
> This is a blockquote
```

### Tables
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Horizontal Rules
```markdown
---
```

## Features

- ✅ GitHub Flavored Markdown (GFM)
- ✅ Syntax highlighting for code
- ✅ Auto-linking URLs
- ✅ Line breaks preserved
- ✅ Tables with hover effects
- ✅ Blockquotes with accent border
- ✅ Responsive text sizing
- ✅ Copy code button (coming soon)

## Styling

### Headings
- H1: 20px, bottom border
- H2: 18px, thin bottom border
- H3: 16px, no border

### Code
- Inline: Light background, rounded
- Block: Syntax-highlighted, scrollable

### Links
- Accent color with underline
- Hover: Solid underline + background

### Lists
- Custom numbered list styling
- Colored markers for bullets
- Proper indentation

## Auto-Detection

The formatter automatically detects markdown patterns:
- Headers (#, ##, ###)
- Bold/italic (**, *)
- Code (`, ```)
- Lists (-, 1.)
- Links ([](url))
- Multiple line breaks (\n\n)

If no markdown detected, renders as plain text with line breaks preserved.

## Technical

### Dependencies
- `marked` v11.1.1 - Markdown parser

### Components
- `MessageFormatter.jsx` - Formatting logic
- `MessageContent` - React component
- `formatMessageText()` - Parser function

### Security
- External links open in new tab
- XSS protection via marked configuration
