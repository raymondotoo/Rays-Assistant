# Rays LLM Dashboard - Learning Mechanism 🧠

## Overview

The Rays LLM Dashboard is designed to **improve over time** through a feedback-driven learning mechanism. Each time you rate a model's response, the system learns and adapts to show you better answers in the future.

## How the Learning System Works

### 1. Feedback Collection

When you interact with the dashboard:
1. You send a message to the LLM ensemble
2. Multiple models generate responses
3. You rate each response (1-5 stars) ⭐
4. Optionally add a comment explaining your rating

**Feedback Data Stored:**
- Message ID
- Model name
- Rating (1-5)
- User comment (optional)
- Timestamp
- Conversation ID

### 2. Model Weight Calculation

The system calculates adaptive weights for each model using:

```
weight = (average_rating / 5.0) × (1 + ln(feedback_count + 1))
```

**Components:**

| Component | Purpose | Range |
|-----------|---------|-------|
| `average_rating / 5.0` | Quality score | 0.0 - 1.0 |
| `ln(feedback_count)` | Confidence boost | 0.0 - ∞ |
| Minimum weight | Prevent elimination | 0.1 |

**Example Calculations:**

| Model | Avg Rating | Feedback | Log(count) | Weight | % |
|-------|-----------|----------|-----------|--------|---|
| Model A | 4.5/5 | 50 | 3.90 | 3.51 | 52% |
| Model B | 3.5/5 | 20 | 2.99 | 2.09 | 31% |
| Model C | 4.0/5 | 5 | 1.79 | 1.43 | 17% |

### 3. Ensemble Response Generation

When you send a message:

1. **Parallel Query**: All selected models receive the message simultaneously
2. **Weighted Evaluation**: Results are ranked by model weight
3. **Ensemble Response**: Top-weighted models are prioritized in the response
4. **Individual Responses**: You see each model's answer separately

```
User Message
    ↓
┌───────────────────────────────────────┐
│ Calculate Model Weights Based on:     │
│ • Historical ratings                  │
│ • Frequency of feedback               │
│ • Recent performance trends           │
└────────┬────┬────────────┬────────────┘
         │    │            │
    Model A Model B    Model C
    (50%)   (31%)      (19%)
         │    │            │
         └────┴────────────┘
              │
      Weighted Ensemble Response
      + Individual Model Answers
```

### 4. Metrics Tracking

The system automatically tracks:

```python
ModelMetrics {
    model_name: str           # e.g., "mistral", "neural-chat"
    model_size_mb: float      # Size in megabytes from Ollama
    avg_response_time: float  # Average time to generate response
    total_requests: int       # Total times queried
    avg_rating: float         # Average user feedback (0-5)
    feedback_count: int       # Total ratings received
}
```

These metrics are displayed in the Metrics Dashboard tab.

## Learning Algorithm Details

### Weight Normalization

After calculating raw weights, they are normalized to sum to 1.0:

```python
normalized_weight = raw_weight / sum(all_raw_weights)
```

This ensures percentages add up to 100%.

### Minimum Feedback Requirement

- **New models** (no feedback): weight = 1.0 (equal with others initially)
- **Models with 1-2 ratings**: Weight grows logarithmically
- **Well-tested models** (50+ ratings): Weight stabilizes based on quality

### Feedback Decay (Optional Future Feature)

Current system: All historical feedback is weighted equally.

Future enhancement could add:
- Exponential decay (recent ratings matter more)
- Window-based averaging (last N ratings)
- Contextual weighting (domain-specific feedback)

## Practical Examples

### Scenario 1: New Model Added

```
Initial State:
├─ Mistral: 4.2 rating, 30 feedback → 65% weight
├─ Neural-Chat: 3.8 rating, 25 feedback → 30% weight
└─ GPT-Turbo (new): 0 feedback → 5% weight

After 10 ratings on GPT-Turbo (avg: 4.7):
├─ Mistral: 4.2 rating, 30 feedback → 45% weight
├─ Neural-Chat: 3.8 rating, 25 feedback → 20% weight
└─ GPT-Turbo: 4.7 rating, 10 feedback → 35% weight
```

### Scenario 2: Improving Model Performance

```
Day 1: Model A gets 3-star ratings
└─ Weight: 30%

Day 5: After optimization, gets 5-star ratings
└─ Weight increases to: 45%

Day 10: Consistent 4.5-star average
└─ Weight stabilizes at: 55%
```

## Dashboard Metrics Explained

### Metrics Tab Shows

**Per Model:**
- 📊 **Model Size**: MB downloaded on disk
- ⚡ **Avg Response**: Average generation time
- ⭐ **Rating**: User feedback average (0-5)
- 📈 **Requests**: How many times queried
- 💬 **Feedback**: Number of ratings received

**Charts:**
- Bar chart: Response times comparison
- Bar chart: Average ratings per model

## API for Manual Integration

### Get Current Model Weights

```python
# In the feedback service
weights = await FeedbackService.get_model_weights(db, model_list)
# Returns: {"mistral": 0.52, "neural-chat": 0.31, "openhermes": 0.17}
```

### Submit Feedback

```bash
POST /api/chat/feedback
{
    "message_id": "abc123",
    "model_name": "mistral",
    "rating": 5,
    "comment": "Very accurate answer!"
}
```

### Get Model Metrics

```bash
GET /api/models/metrics/mistral
{
    "model_name": "mistral",
    "model_size_mb": 3824.5,
    "avg_response_time": 2.34,
    "total_requests": 150,
    "avg_rating": 4.2,
    "total_feedback_count": 45
}
```

## Tips for Effective Learning

### ✅ Best Practices

1. **Rate Consistently**: Regular feedback helps the system learn faster
2. **Be Specific**: Add comments explaining your ratings
3. **Test Different Models**: Rate all models to fill data gaps
4. **Specific Tasks**: Rate models on specific tasks they seem suited for
5. **Monitor Trends**: Check Metrics tab to see improvements

### ❌ Avoid

- Rating randomly (introduces noise)
- Ignoring poor responses (system won't know)
- Only rating favorite model (biases weights)
- Changing criteria frequently (confuses learning)

## Technical Implementation

### Database Tables

```sql
-- Feedback Storage
CREATE TABLE feedback (
    id UUID PRIMARY KEY,
    conversation_id UUID,
    message_id UUID,
    model_name VARCHAR,
    rating INTEGER,  -- 1-5
    comment TEXT,
    created_at DATETIME,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- Model Metrics
CREATE TABLE model_metrics (
    id UUID PRIMARY KEY,
    model_name VARCHAR UNIQUE,
    model_size_mb FLOAT,
    avg_response_time FLOAT,
    total_requests INTEGER,
    avg_rating FLOAT,
    total_feedback_count INTEGER,
    last_updated DATETIME
);
```

### Weight Calculation Service

Source: `backend/app/services/feedback.py`

```python
async def get_model_weights(db: AsyncSession, models: list) -> dict:
    weights = {}
    
    for model in models:
        avg_rating = await FeedbackService.get_model_rating(db, model)
        feedback_count = await FeedbackService.get_feedback_count(db, model)
        
        # Weight = quality × confidence
        if feedback_count > 0:
            weight = (avg_rating / 5.0) * (1 + math.log(feedback_count + 1))
        else:
            weight = 1.0  # Equal weight for new models
        
        weights[model] = max(weight, 0.1)  # Minimum 0.1
    
    # Normalize
    total = sum(weights.values())
    return {model: w / total for model, w in weights.items()}
```

## Future Enhancements 🚀

Planned improvements to the learning system:

- [ ] **Real-time Updates**: Live weight recalculation
- [ ] **A/B Testing**: Automatic model comparison
- [ ] **Domain-Specific Weights**: Different weights for different topics
- [ ] **User Preferences**: Learn individual user preferences
- [ ] **Feedback Decay**: Recent feedback matters more
- [ ] **Fine-tuning**: Auto-fine-tune based on feedback
- [ ] **Export Insights**: Download performance reports
- [ ] **Confidence Intervals**: Show uncertainty in ratings

## Conclusion

The Rays LLM Dashboard's learning mechanism is designed to:
1. ✅ **Improve continuously** based on real user feedback
2. ✅ **Personalize** to your preferences over time
3. ✅ **Balance** between quality and confidence
4. ✅ **Adapt** to new models and changing performance
5. ✅ **Empower** users with transparent metrics

The more you use and rate the system, the smarter it becomes! 🧠✨
