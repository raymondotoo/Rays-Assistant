# Architecture & Implementation Guide

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (React + Vite)                │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ Chat UI      │  │ Model       │  │ Metrics Dashboard    │   │
│  │ • Messages   │  │ Selector    │  │ • Performance        │   │
│  │ • Input Box  │  │ • Toggle    │  │ • Model Sizes        │   │
│  │ • Responses  │  │   models    │  │ • Response Times     │   │
│  └──────────────┘  └─────────────┘  └──────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP REST API
┌────────────────────────────▼─────────────────────────────────────┐
│                API LAYER (FastAPI, Port 8000)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Chat Routes  │  │ Model Routes │  │ Health/Config Routes │  │
│  │ • Send       │  │ • Available  │  │ • Status             │  │
│  │ • Feedback   │  │ • Metrics    │  │ • Info               │  │
│  │ • Converse   │  │ • Details    │  │ • Docs               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Ollama     │    │  SQLite      │    │  Service     │
│   API        │    │  Database    │    │  Layer       │
│              │    │              │    │              │
│ • Generate   │    │ • Feedback   │    │ • Weight     │
│ • Models     │    │ • Messages   │    │   Calc       │
│ • Info       │    │ • Metrics    │    │ • Metrics    │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow

### Chat Message Flow

```
User Input
    │
    ▼
[React Chat Component]
    │
    ├─ Store in Zustand
    ├─ Serialize to JSON
    └─ POST to /api/chat/send
        │
        ▼
    [FastAPI Backend]
        │
        ├─ Validate request
        ├─ Get conversation
        ├─ Calculate model weights from feedback
        └─ Parallel query to Ollama
            │
            ├─ Model A: "response_a"
            ├─ Model B: "response_b"
            └─ Model C: "response_c"
        │
        ├─ Store messages in SQLite
        ├─ Calculate metrics
        └─ Create ensemble response
        │
        ▼
    [Response JSON]
        {
            "conversation_id": "...",
            "responses": {
                "mistral": "...",
                "neural-chat": "...",
                "openhermes": "..."
            },
            "ensemble_response": "...",
            "models_used": ["mistral", "neural-chat", "openhermes"],
            "timestamp": "2024-03-12T..."
        }
        │
        ▼
    [React Frontend]
        │
        ├─ Update Zustand store
        ├─ Render individual responses
        ├─ Render ensemble response
        └─ Enable feedback forms
```

### Feedback & Learning Flow

```
User Rates Response (e.g., 5 stars for Mistral)
    │
    ▼
[FeedbackForm Component]
    │
    └─ POST /api/chat/feedback
        │
        ▼
    [FastAPI Feedback Endpoint]
        │
        ├─ Store feedback in database
        ├─ Update model_metrics table
        └─ Return success
        │
    ▼
[Feedback Service - get_model_weights()]
    │
    ├─ Query average rating for each model
    ├─ Query feedback count for each model
    ├─ Calculate: weight = (rating/5) × (1 + ln(count))
    ├─ Normalize weights to sum to 1.0
    └─ Return: {"mistral": 0.52, "neural-chat": 0.31, ...}
        │
    ▼
[Next Query]
    │
    ├─ Use updated weights for ensemble
    └─ Better models get more influence
```

## Component Architecture

### Backend Components

```
app/
├── core/
│   └── config.py          # Settings, default models, API config
├── db/
│   └── database.py        # SQLAlchemy setup, async session
├── models/
│   ├── schema.py          # SQLAlchemy ORM models
│   └── schemas.py         # Pydantic request/response models
├── routes/
│   ├── chat.py            # Chat endpoints (send, feedback)
│   └── models.py          # Model endpoints (list, metrics)
├── services/
│   ├── ollama.py          # Ollama API integration
│   └── feedback.py        # Weight calculation, metrics update
└── __init__.py

main.py                    # FastAPI app initialization
requirements.txt           # Python dependencies
```

### Frontend Components

```
src/
├── components/
│   ├── ChatInput.jsx      # Message input + send button
│   ├── ChatMessages.jsx   # Display conversation history
│   ├── ModelSelector.jsx  # Model toggle buttons
│   ├── MetricsDashboard.jsx # Performance charts/stats
│   └── FeedbackForm.jsx   # Star rating interface
├── App.jsx                # Main app layout + navigation
├── main.jsx               # React entry point
├── index.css              # Global styles
├── store.js               # Zustand state management
└── api.js                 # Axios API client

package.json               # Node dependencies
vite.config.js             # Vite build config
tailwind.config.js         # Tailwind CSS config
```

## Database Schema

### Tables

#### conversations
```sql
id (UUID PK)
title (VARCHAR)
created_at (DATETIME)
updated_at (DATETIME)
```

#### messages
```sql
id (UUID PK)
conversation_id (UUID FK)
role (VARCHAR)           -- "user" or "assistant"
content (TEXT)
models_used (JSON)       -- ["mistral", "neural-chat"]
created_at (DATETIME)
```

#### feedback
```sql
id (UUID PK)
conversation_id (UUID FK)
message_id (UUID FK)
model_name (VARCHAR)
rating (INTEGER)         -- 1-5
comment (TEXT)
created_at (DATETIME)
```

#### model_metrics
```sql
id (UUID PK)
model_name (VARCHAR UNIQUE)
model_size_mb (FLOAT)
avg_response_time (FLOAT)
total_requests (INTEGER)
avg_rating (FLOAT)
total_feedback_count (INTEGER)
last_updated (DATETIME)
metadata (JSON)          -- Extra info
```

## API Specification

### Chat Endpoints

#### POST /api/chat/conversations
Create a new conversation
```json
Request: { "title": "My Chat" }
Response: { "id": "uuid", "title": "My Chat", "created_at": "...", "messages": [] }
```

#### GET /api/chat/conversations/{id}
Get conversation with all messages
```json
Response: { "id": "uuid", "title": "...", "messages": [...], "created_at": "..." }
```

#### POST /api/chat/send
Send message to models
```json
Request: {
    "conversation_id": "uuid",
    "message": "What is AI?",
    "models": ["mistral", "neural-chat"],
    "use_ensemble": true
}
Response: {
    "conversation_id": "uuid",
    "user_message_id": "uuid",
    "responses": {
        "mistral": "AI is...",
        "neural-chat": "AI stands for..."
    },
    "ensemble_response": "[Ensemble Response...] blended...",
    "models_used": ["mistral", "neural-chat"],
    "timestamp": "2024-03-12T..."
}
```

#### POST /api/chat/feedback
Submit rating for a response
```json
Request: {
    "message_id": "uuid",
    "model_name": "mistral",
    "rating": 5,
    "comment": "Great answer!"
}
Response: { "id": "uuid", "rating": 5, "created_at": "..." }
```

### Model Endpoints

#### GET /api/models/available
List available models from Ollama
```json
Response: {
    "models": [
        { "name": "mistral:latest", "size": 3824 },
        { "name": "neural-chat:latest", "size": 2048 }
    ],
    "count": 2
}
```

#### GET /api/models/metrics
Get metrics for all models
```json
Response: [
    {
        "model_name": "mistral",
        "model_size_mb": 3824,
        "avg_response_time": 2.34,
        "total_requests": 150,
        "avg_rating": 4.2,
        "total_feedback_count": 45,
        "last_updated": "2024-03-12T..."
    }
]
```

#### GET /api/models/metrics/{model_name}
Get metrics for specific model
```json
Response: { "model_name": "mistral", "model_size_mb": 3824, ... }
```

### Health Endpoints

#### GET /health
Health check
```json
Response: { "status": "healthy", "service": "Rays LLM Dashboard" }
```

## State Management (Frontend)

### Zustand Stores

#### useChatStore
```javascript
{
    conversationId,          // Current conversation UUID
    messages,               // Array of {role, content, model}
    models,                 // Available models
    selectedModels,         // Selected for ensemble
    loading,                // Query in progress
    
    // Methods
    createConversation(),
    sendMessage(text),
    setSelectedModels(models)
}
```

#### useMetricsStore
```javascript
{
    metrics,               // Array of model metrics
    availableModels,       // Models from Ollama
    
    // Methods
    fetchMetrics(),
    fetchAvailableModels()
}
```

## Request/Response Flow Diagram

```
┌─ USER SENDS MESSAGE ─┐
│      "Chat?"         │
└──────────┬───────────┘
           │
           ▼
    [Frontend Store]
    · Save to Zustand
    · Mark loading=true
           │
           ▼
    POST /api/chat/send
    {
      "conversation_id": "...",
      "message": "Chat?",
      "models": ["mistral", "neural-chat"],
      "use_ensemble": true
    }
           │
           ▼
┌──────────────────────┐
│   FastAPI Backend    │
├──────────────────────┤
│ 1. Get conversation  │
│ 2. Create user msg   │
│ 3. Calc weights:     │
│    - Mistral: 0.65   │
│    - N-Chat:  0.35   │
│ 4. Query Ollama      │
│ 5. Store responses   │
│ 6. Update metrics    │
│ 7. Create ensemble   │
└───────────┬──────────┘
            │
            ▼
    Response (200 OK):
    {
      "responses": {
        "mistral": "Yes, I'll chat...",
        "neural-chat": "Sure! How can..."
      },
      "ensemble_response": "[Both models...]",
      "timestamp": "..."
    }
            │
            ▼
    [Frontend Update]
    · Update store
    · Render messages
    · Show feedback forms
    · Mark loading=false
```

## Performance Considerations

### Concurrent Requests
- All models queried in parallel using `asyncio`
- Timeout: 300 seconds per model
- No request blocking

### Database
- Async SQLite with aiosqlite
- Connection pooling for efficiency
- Indexed on model_name for metrics queries

### Frontend
- Lazy component loading (Vite code splitting)
- Real-time metrics polling (5s interval)
- Efficient re-renders (Zustand subscriptions)

## Security Considerations

### CORS
- Configurable allowed origins
- Matches frontend ports (3000, 5173)
- Prevents unauthorized API access

### Input Validation
- Pydantic schemas validate all inputs
- Rating: 1-5 range enforced
- Model names sanitized

### Database
- SQLite default (not production-ready)
- Can upgrade to PostgreSQL
- No SQL injection via ORM

## Scalability

### Current Limitations
- Single machine deployment
- SQLite not suitable for multiple processes
- Single Ollama instance

### Future Improvements
- Docker deployment
- PostgreSQL for persistence
- Multiple Ollama instances
- Model caching layer
- Redis for sessions

## Deployment Considerations

### Development
```bash
# Current setup
uvicorn main:app --reload
npm run dev
```

### Production
```bash
# Gunicorn for production
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app

# Build React
npm run build  # Outputs dist/

# Serve static files
python -m http.server 3000 --directory dist
```

---

This architecture provides:
✅ Modular, maintainable code
✅ Real-time feedback integration
✅ Scalable ensemble system
✅ Clean separation of concerns
✅ Easy to extend and customize
