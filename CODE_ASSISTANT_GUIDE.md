# Code Assistant Feature Documentation

## Overview
The Code Assistant feature allows users to get AI-powered code reviews and suggestions directly within your LLM dashboard.

## Features

### 1. **Split-Pane Code Editor**
   - **Left Pane - "My Code"**: Paste or write your code here
   - **Right Pane - "Updated Code"**: See AI suggestions and corrections
   - Both sections have copy buttons for easy clipboard access

### 2. **Code Chat Interface**
   - Describe your coding issue or problem in the chat
   - The LLM analyzes your code and provides suggestions
   - Chat history shows the conversation thread
   - Real-time feedback as you interact

### 3. **Workflow Steps**

   **Step 1**: Select "💻 Coding" tab from the left sidebar
   
   **Step 2**: Paste your problematic code into the "My Code" section
   
   **Step 3**: Type your issue description at the bottom:
   - Example: "This function is adding strings instead of numbers, fix it"
   - Be specific about what's wrong
   
   **Step 4**: Press Send or hit Shift+Enter
   
   **Step 5**: View the suggested code in the "Updated Code" pane
   
   **Step 6**: Click "✓ Apply Updated Code" to update the left pane with suggestions
   
   **Step 7**: Continue refining or clear with "🗑️ Clear All" when done

### 4. **Backend Code Review Endpoint**

**Endpoint**: `POST /api/chat/code-review`

**Request Body**:
```json
{
  "original_code": "def add(a, b):\n    return a + b\n\nresult = add(\"5\", \"3\")",
  "issue_description": "The function is adding strings instead of numbers"
}
```

**Response**:
```json
{
  "suggested_code": "def add(a, b):\n    return int(a) + int(b)\n\nresult = add(5, 3)\nprint(result)",
  "explanation": "The issue was that you were passing string arguments which concatenate instead of add. I converted them to integers and passed actual numbers.",
  "improvements": null,
  "timestamp": "2026-03-13T00:15:30.123456"
}
```

## Technical Implementation

### Frontend Components Created:

1. **CodingEditor.jsx** (`frontend/src/components/CodingEditor.jsx`)
   - Main container with split-pane layout
   - Manages state for original code, updated code, and chat messages
   - Handles API calls to backend code review endpoint
   - Provides copy and apply functionality

2. **CodeChat.jsx** (`frontend/src/components/CodeChat.jsx`)
   - Chat interface specific to code reviews
   - Message display with timestamps
   - Input field with keyboard shortcuts (Shift+Enter for new line)
   - Loading state with animated spinner

### Backend Endpoint Created:

**File**: `backend/app/routes/chat.py`
- New `@router.post("/code-review")` endpoint
- Uses Mistral model for code analysis
- Parses LLM response to extract corrected code and explanation

### Schema Updates:

**File**: `backend/app/models/schemas.py`
- Added `CodeReviewRequest` schema
- Added `CodeReviewResponse` schema

### Frontend UI Updates:

**File**: `frontend/src/App.jsx`
- Added "💻 Coding" tab to sidebar navigation
- Updated header to show "Code Assistant" when on coding tab
- Conditionally hide metrics header during coding
- Include CodingEditor component when coding tab is active

## Usage Examples

### Example 1: Type Conversion Issue
**Your Code**:
```python
def multiply(a, b):
    return a * b

result = multiply("3", "4")
print(result)
```

**Issue**: "Function multiplying strings, need to multiply numbers"

**AI Response**:
```python
def multiply(a, b):
    return int(a) * int(b)

result = multiply(3, 4)
print(result)
```

### Example 2: Missing Function
**Your Code**:
```python
def greet(name):
    print(name)

greet("Alice")
```

**Issue**: "Add 'Hello' before the name"

**AI Response**:
```python
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")
```

## Navigation

- **Enter Coding Tab**: Click "💻 Coding" in left sidebar
- **Switch Tabs**: Click between "💬 Chat", "💻 Coding", and "📊 Metrics"
- **Leave Coding**: Click "💬 Chat" or "📊 Metrics" to switch contexts

## Tips

1. **Be Specific**: The better you describe the issue, the better the suggestions
2. **Full Context**: Paste complete functions or classes for better analysis
3. **Iterate**: Refine suggestions by asking follow-up questions in the chat
4. **Copy Code**: Use the copy buttons to quickly get code into your IDE
5. **Apply Updates**: Use "Apply Updated Code" to move suggestions to the left pane

## Limitations

- Currently uses Mistral model for all code reviews
- Code review focuses on functional fixes, not style optimization
- Large code snippets (>5000 lines) may timeout

## Future Enhancements

- Support for multiple programming languages with syntax highlighting
- Code format preservation and language detection
- Integration with actual code linters (eslint, pylint, etc.)
- Ability to use different models for code review
- Code diff visualization
- History of code reviews in the same session
