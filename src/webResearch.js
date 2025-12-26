// Web Research & Deep Analysis Module
// Provides web search and content fetching capabilities

const BRAVE_SEARCH_API = 'https://api.search.brave.com/res/v1/web/search'
const JINA_READER_API = 'https://r.jina.ai'

/**
 * Search the web using Brave Search API
 * @param {string} query - Search query
 * @param {string} apiKey - Brave API key (optional, uses free tier if not provided)
 * @param {number} count - Number of results (default: 5)
 * @returns {Promise<Array>} Search results with title, url, description
 */
export async function searchWeb(query, apiKey = null, count = 5) {
  try {
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    }

    if (apiKey) {
      headers['X-Subscription-Token'] = apiKey
    }

    const url = `${BRAVE_SEARCH_API}?q=${encodeURIComponent(query)}&count=${count}`

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.web || !data.web.results) {
      return []
    }

    return data.web.results.map(result => ({
      title: result.title,
      url: result.url,
      description: result.description,
      age: result.age,
      extra_snippets: result.extra_snippets || []
    }))
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

/**
 * Fetch and extract clean content from a URL using Jina Reader
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Extracted content with title and text
 */
export async function fetchUrlContent(url) {
  try {
    const jinaUrl = `${JINA_READER_API}/${url}`

    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown'
      }
    })

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`)
    }

    const data = await response.json()

    return {
      title: data.title || 'Untitled',
      content: data.content || '',
      url: url,
      description: data.description || ''
    }
  } catch (error) {
    console.error('URL fetch error:', error)
    return null
  }
}

/**
 * Research a topic by searching and analyzing top results
 * @param {string} query - Research query
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Research results with sources and summary
 */
export async function researchTopic(query, options = {}) {
  const {
    apiKey = null,
    resultCount = 5,
    fetchContent = true,
    maxContentLength = 2000
  } = options

  console.log(`🔍 Researching: ${query}`)

  // Step 1: Search the web
  const searchResults = await searchWeb(query, apiKey, resultCount)

  if (searchResults.length === 0) {
    return {
      success: false,
      query,
      sources: [],
      error: 'No search results found'
    }
  }

  console.log(`✓ Found ${searchResults.length} results`)

  // Step 2: Optionally fetch full content from top results
  let sources = searchResults

  if (fetchContent) {
    console.log('📄 Fetching content from top results...')
    const contentPromises = searchResults.slice(0, 3).map(result => 
      fetchUrlContent(result.url)
        .then(content => ({
          ...result,
          fullContent: content ? content.content.slice(0, maxContentLength) : null
        }))
        .catch(() => result)
    )

    const fetchedResults = await Promise.all(contentPromises)

    // Merge with remaining results that weren't fetched
    sources = [
      ...fetchedResults,
      ...searchResults.slice(3)
    ]
  }

  return {
    success: true,
    query,
    sources,
    timestamp: Date.now()
  }
}

/**
 * Format research results for display in chat
 * @param {Object} research - Research results object
 * @returns {string} Formatted text for display
 */
export function formatResearchResults(research) {
  if (!research.success) {
    return `❌ Research failed: ${research.error}`
  }

  let output = `🔍 **Research Results for:** "${research.query}"\n\n`

  research.sources.forEach((source, idx) => {
    output += `**${idx + 1}. ${source.title}**\n`
    output += `🔗 ${source.url}\n`
    output += `${source.description}\n`

    if (source.fullContent) {
      output += `\n*Summary:* ${source.fullContent.slice(0, 200)}...\n`
    }

    output += `\n`
  })

  return output
}

/**
 * Extract key facts from research results for embedding
 * @param {Object} research - Research results
 * @returns {string} Concatenated key information
 */
export function extractResearchContext(research) {
  if (!research.success) return ''

  let context = `Research query: ${research.query}\n\n`

  research.sources.forEach(source => {
    context += `${source.title}: ${source.description} `
    if (source.fullContent) {
      context += source.fullContent.slice(0, 500) + ' '
    }
  })

  return context.trim()
}
