// Web Research & Deep Analysis Module - FIXED
// Using reliable CORS-friendly APIs

/**
 * Search the web using DuckDuckGo Instant Answer API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
export async function searchWeb(query) {
  try {
    console.log(`🔍 Searching web for: ${query}`)

    // Use DuckDuckGo HTML API via CORS proxy
    const corsProxy = 'https://api.allorigins.win/raw?url='
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

    const response = await fetch(corsProxy + encodeURIComponent(searchUrl), {
      headers: {
        'Accept': 'text/html'
      }
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const html = await response.text()

    // Parse results from HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const results = []

    // Extract search results
    const resultElements = doc.querySelectorAll('.result')

    for (let i = 0; i < Math.min(5, resultElements.length); i++) {
      const elem = resultElements[i]
      const titleElem = elem.querySelector('.result__title')
      const snippetElem = elem.querySelector('.result__snippet')
      const urlElem = elem.querySelector('.result__url')

      if (titleElem && urlElem) {
        results.push({
          title: titleElem.textContent.trim(),
          url: urlElem.getAttribute('href') || urlElem.textContent.trim(),
          description: snippetElem ? snippetElem.textContent.trim() : '',
          source: 'DuckDuckGo'
        })
      }
    }

    console.log(`✓ Found ${results.length} results`)
    return results

  } catch (error) {
    console.error('DuckDuckGo search error:', error)

    // Fallback to Wikipedia API
    try {
      console.log('🔄 Trying Wikipedia fallback...')
      return await searchWikipedia(query)
    } catch (fallbackError) {
      console.error('Wikipedia fallback failed:', fallbackError)
      return []
    }
  }
}

/**
 * Search Wikipedia as fallback
 * @param {string} query - Search query
 * @returns {Promise<Array>} Wikipedia results
 */
export async function searchWikipedia(query) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`

  const response = await fetch(apiUrl)
  const data = await response.json()

  if (!data.query || !data.query.search) {
    return []
  }

  return data.query.search.map(result => ({
    title: result.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
    description: result.snippet.replace(/<[^>]*>/g, ''), // Remove HTML tags
    source: 'Wikipedia'
  }))
}

/**
 * Fetch content from URL using CORS proxy
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Extracted content
 */
export async function fetchUrlContent(url) {
  try {
    // Use AllOrigins as CORS proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`

    const response = await fetch(proxyUrl)
    const data = await response.json()

    if (!data.contents) {
      return null
    }

    // Parse HTML content
    const parser = new DOMParser()
    const doc = parser.parseFromString(data.contents, 'text/html')

    // Remove script and style tags
    doc.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove())

    // Extract text content
    const title = doc.querySelector('title')?.textContent || 'Untitled'
    const paragraphs = Array.from(doc.querySelectorAll('p'))
      .map(p => p.textContent.trim())
      .filter(text => text.length > 50)
      .slice(0, 5)
      .join('\n\n')

    return {
      title,
      content: paragraphs.slice(0, 2000),
      url,
      description: paragraphs.slice(0, 300)
    }
  } catch (error) {
    console.error('Content fetch error:', error)
    return null
  }
}

/**
 * Research a topic with search and optional content fetching
 * @param {string} query - Research query
 * @param {Object} options - Configuration
 * @returns {Promise<Object>} Research results
 */
export async function researchTopic(query, options = {}) {
  const {
    resultCount = 5,
    fetchContent = true,
    maxContentLength = 2000
  } = options

  console.log(`🔍 Researching: ${query}`)

  try {
    // Step 1: Search the web
    const searchResults = await searchWeb(query)

    if (searchResults.length === 0) {
      return {
        success: false,
        query,
        sources: [],
        error: 'No search results found. Try a different query.'
      }
    }

    console.log(`✓ Found ${searchResults.length} results`)

    // Step 2: Optionally fetch content from top results
    let sources = searchResults

    if (fetchContent && searchResults.length > 0) {
      console.log('📄 Fetching content from top results...')

      // Only fetch from first 2 results to avoid rate limits
      const fetchPromises = searchResults.slice(0, 2).map(async (result) => {
        try {
          const content = await fetchUrlContent(result.url)
          return {
            ...result,
            fullContent: content ? content.content.slice(0, maxContentLength) : null
          }
        } catch {
          return result
        }
      })

      const fetchedResults = await Promise.all(fetchPromises)

      // Merge with remaining results
      sources = [
        ...fetchedResults,
        ...searchResults.slice(2)
      ]

      console.log('✓ Content fetched')
    }

    return {
      success: true,
      query,
      sources,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('Research error:', error)
    return {
      success: false,
      query,
      sources: [],
      error: error.message || 'Research failed. Please try again.'
    }
  }
}

/**
 * Format research results for display
 * @param {Object} research - Research results
 * @returns {string} Formatted text
 */
export function formatResearchResults(research) {
  if (!research.success) {
    return `❌ Research failed: ${research.error}`
  }

  if (research.sources.length === 0) {
    return `🔍 No results found for: "${research.query}"\n\nTry rephrasing your query or checking your spelling.`
  }

  let output = `🔍 **Web Research: "${research.query}"**\n\n`
  output += `Found ${research.sources.length} sources:\n\n`

  research.sources.forEach((source, idx) => {
    output += `**${idx + 1}. ${source.title}**\n`
    output += `🔗 ${source.url}\n`

    if (source.description) {
      output += `${source.description}\n`
    }

    if (source.fullContent) {
      const preview = source.fullContent.slice(0, 250)
      output += `\n📄 *Content preview:* ${preview}...\n`
    }

    output += `\n`
  })

  return output
}

/**
 * Extract research context for AI analysis
 * @param {Object} research - Research results
 * @returns {string} Context string
 */
export function extractResearchContext(research) {
  if (!research.success || research.sources.length === 0) {
    return ''
  }

  let context = `Research query: ${research.query}\n\n`
  context += 'Sources:\n'

  research.sources.forEach((source, idx) => {
    context += `\n${idx + 1}. ${source.title}\n`
    context += `${source.description}\n`

    if (source.fullContent) {
      context += `Content: ${source.fullContent.slice(0, 800)}\n`
    }
  })

  return context.trim()
}

/**
 * Quick search for immediate results (no content fetching)
 * @param {string} query - Search query
 * @returns {Promise<Object>} Quick results
 */
export async function quickSearch(query) {
  return await researchTopic(query, {
    resultCount: 5,
    fetchContent: false,
    maxContentLength: 0
  })
}
