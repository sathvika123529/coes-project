# Policy Document Topic Modeling — LDA Real-Time App

## Architecture
```
┌─────────────────────────────────┐     ┌──────────────────────────────┐
│     REACT FRONTEND (Vite)       │────▶│   FASTAPI BACKEND (Python)   │
│     http://localhost:3000       │     │   http://localhost:8000      │
│                                 │     │                              │
│  • Upload / paste policy docs   │ WS  │  • /api/analyze   POST       │
│  • Configure LDA params         │◀───▶│  • /api/upload    POST       │
│  • Real-time progress via WS    │     │  • /api/sample    GET        │
│  • Topic cards + word bars      │     │  • /api/health    GET        │
│  • Doc-Topic heatmap            │     │  • /ws            WebSocket  │
│  • TF-IDF chart                 │     │                              │
│  • Radar chart                  │     │  Pure Python LDA (no sklearn)│
│  • Word frequency dist          │     │  Gibbs Sampling algorithm    │
└─────────────────────────────────┘     └──────────────────────────────┘
```

## Requirements
- **Python 3.14** (no external ML libraries — pure stdlib LDA)
- **Node.js 18+** (for React/Vite frontend)

## Setup & Run

### Backend
```bash
cd backend
pip3 install -r requirements.txt
python3 main.py
# Starts at http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Starts at http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Run LDA on document text |
| POST | `/api/upload` | Upload .txt file |
| GET | `/api/sample` | Get sample policy doc |
| GET | `/api/health` | Health check |
| WS | `/ws` | Real-time progress stream |

### POST /api/analyze

**Request:**
```json
{
  "text": "Full policy document text...",
  "n_topics": 5,
  "n_iter": 30,
  "doc_name": "my_policy.txt"
}
```

**Response:**
```json
{
  "model_id": "model_1234567",
  "document": { "token_count": 850, "vocab_size": 320, "chunks": 5 },
  "topics": [
    {
      "id": 0,
      "label": "Topic: Environment / Climate / Policy",
      "words": [{ "word": "environment", "weight": 0.045 }, ...],
      "doc_weights": [0.6, 0.1, 0.2, 0.05, 0.05],
      "dominant_docs": 2
    }
  ],
  "doc_assignments": [...],
  "top_tfidf_words": [...],
  "word_frequency": [...],
  "elapsed_seconds": 2.3
}
```

### WebSocket Messages

Progress during analysis:
```json
{ "type": "progress", "step": "gibbs_sampling", "value": 67, "message": "Gibbs sampling iteration 20/30..." }
```

Final result:
```json
{ "type": "result", "data": { ... same as REST response ... } }
```

## LDA Implementation Details

The backend implements **Latent Dirichlet Allocation** from scratch using:

1. **Text Preprocessing** — lowercasing, punctuation removal, stopword filtering (200+ words)
2. **Document Chunking** — splits input into ~5 segments for multi-document LDA
3. **Vocabulary Building** — indexes all unique tokens
4. **Gibbs Sampling** — collapsed Gibbs sampler for posterior inference
   - α (document-topic prior) = 0.1
   - β (topic-word prior) = 0.01
   - Configurable iterations (10–100)
5. **Distribution Extraction** — normalized topic-word and doc-topic distributions
6. **TF-IDF** — computed in parallel for keyword importance ranking

No scikit-learn, gensim, or NLTK required — pure Python 3.14.

## UI Features

- **Topics Tab** — Interactive topic explorer with word chips and probability bars
- **Doc Map Tab** — Color-coded heatmap of topic distribution across document chunks
- **TF-IDF Tab** — Top keywords by TF-IDF score
- **Word Freq Tab** — Raw word frequency distribution
- **Radar Tab** — Polygon radar chart of topic strengths
- **Real-time WS progress bar** — Live Gibbs sampling progress
- **File upload** — .txt file support
- **WebSocket reconnection** — Auto-reconnects on disconnect
