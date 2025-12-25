# Flonest Chat - V2 Production Pipeline

Corrected, production-safe RAG pipeline with bounded search, selective embedding, and strict scoring.

## ✅ V2 Architecture (Implemented)

### 1. **Bounded Retrieval**
- Only scans last **200 embedded messages** (not full DB)
- Prevents unbounded scan degradation

### 2. **Strict Scoring**
`Score = Similarity * RecencyWeight * RoleWeight`
- **Recency:** 3-day half-life decay
- **Role:** User (1.0) vs Assistant (0.6)
- **Threshold:** 0.75 min score
- **Top K:** 6 messages

### 3. **Leakage Prevention**
- User message saved **AFTER** retrieval
- Prevents self-match pollution

### 4. **Selective Assistant Embedding**
- Assistant response embedded ONLY if:
  - Length > 200 chars
  - Contains code, lists, JSON, or markers
- Prevents filler pollution ("Okay, I can do that")

## 🚀 Usage
1. **Config:** Set API key, threshold, and Top K
2. **Chat:** Messages auto-processed via V2 pipeline
3. **Debug:** Check console for `🧠 V2 Retrieval` logs

## 📊 Defaults
- Candidate Cap: 200
- Top K: 6
- Threshold: 0.75
- Half-life: 3 days

Built by Perplexity AI • V2 Correctness Patch
