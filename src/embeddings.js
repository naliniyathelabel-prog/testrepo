// Gemini embeddings and vector similarity
export const getEmbedding = async (text, apiKey) => {
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

export const semanticSearch = (query, messages, topK = 5) => {
  if (!query.embedding || !messages.length) return messages;

  const scored = messages
    .filter(m => m.embedding)
    .map(m => ({
      ...m,
      score: cosineSimilarity(query.embedding, m.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
};
