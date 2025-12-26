# Web Research Feature

## Overview
Deep web research and analysis capability integrated into Flonest chat.

## Features
- 🔍 **Web Search**: Search the web using Brave Search API
- 📄 **Content Extraction**: Fetch and extract clean content from URLs using Jina Reader
- 🧠 **Deep Analysis**: AI-powered analysis of research results using Gemini
- 💾 **Context Integration**: Research results integrated with conversation context
- 🎯 **Smart Formatting**: Clean, readable presentation of sources

## How to Use

### 1. Basic Research
1. Type your research query in the input box
2. Click the 🌐 Globe icon (or press Ctrl/Cmd + Enter)
3. The system will:
   - Search the web for relevant sources
   - Fetch content from top 3 results
   - Display formatted results with links
   - Analyze findings with Gemini AI (if API key is set)

### 2. Research Workflow
```
User Query → Web Search → Content Fetch → Format Results → AI Analysis
```

### 3. API Configuration (Optional)
- **Brave Search API**: Add your API key in config for better rate limits
- **No API Key**: Works with free tier (limited requests)

## Technical Details

### Files Added
- `src/webResearch.js` - Core research module

### Functions
- `searchWeb(query, apiKey, count)` - Search the web
- `fetchUrlContent(url)` - Extract content from URL
- `researchTopic(query, options)` - Full research workflow
- `formatResearchResults(research)` - Format for display
- `extractResearchContext(research)` - Extract context for AI

### APIs Used
- **Brave Search API**: `https://api.search.brave.com/res/v1/web/search`
- **Jina Reader API**: `https://r.jina.ai`

## Example Usage

**Query:** "Latest developments in quantum computing 2025"

**Output:**
1. Search results with titles, URLs, descriptions
2. Content summaries from top sources
3. AI-powered analysis combining all findings

## Benefits
- ✅ Access to real-time web information
- ✅ Multiple source verification
- ✅ AI-powered synthesis of findings
- ✅ Clean, distraction-free content
- ✅ Integrated with conversation context

## Limitations
- Free tier has rate limits
- Content extraction may fail for some sites
- Requires internet connection
