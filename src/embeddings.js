// Vector operations + Production Scoring Logic

export const getEmbedding = async (text, apiKey) => {
  if (!text || !text.trim()) return null;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] }
        })
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.embedding?.values || null;
  } catch (err) {
    console.error('Embedding error:', err);
    return null;
  }
};

export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

// V2 SCORING LOGIC
// similarity * recencyWeight * roleWeight
export const calculateScore = (msg, queryEmbedding, now = Date.now()) => {
  if (!msg.embedding) return 0;

  const similarity = cosineSimilarity(queryEmbedding, msg.embedding);

  // Recency Decay (Half-life: 3 days)
  // 3 days = 259200000 ms
  const age = Math.max(0, now - (msg.timestamp || 0));
  const halfLife = 3 * 24 * 60 * 60 * 1000; 
  const recencyWeight = Math.pow(0.5, age / halfLife);

  // Role Weight
  const roleWeight = msg.role === 'user' ? 1.0 : 0.6; // Assist less weighted

  return similarity * recencyWeight * roleWeight;
};

export const semanticSearch = (queryEmbedding, messages, config) => {
  if (!queryEmbedding || !messages.length) return [];

  const { topK = 6, threshold = 0.75 } = config;

  const scored = messages.map(m => ({
    ...m,
    score: calculateScore(m, queryEmbedding),
    rawSimilarity: cosineSimilarity(queryEmbedding, m.embedding) // for debug
  }));

  // Filter by threshold AND Sort by score
  const selected = scored
    .filter(m => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // Re-sort chronologically for context flow
  return selected.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

// Selective embedding gate for assistant messages
export const shouldEmbedAssistant = (text) => {
  if (!text) return false;
  if (text.length < 200) return false; // Too short = likely chitchat

  // High-signal markers
  const markers = [
    '```', // Code
    '{',   // JSON/Data
    '1.',  // Lists
    '* ',  // Bullets
    'important', 'because', 'therefore', 'summary'
  ];

  return markers.some(m => text.includes(m));
};
