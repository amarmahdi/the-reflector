---
description: "B4 — AI Analysis API: Uses Gemini to find journal/discipline patterns"
depends_on: [backend-1-scaffold, backend-2-auth]
agent: agent-b4
---

# B4 — Gemini AI Analysis API

## Objective

Build integration with Google Gemini Pro to process user journal entries and discipline snapshots, returning structured actionable insights.

## Files to Create

### `backend/app/core/ai.py`

```python
import json
from google import genai
from app.config import get_settings

class GeminiClient:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def analyze_structured(self, prompt: str) -> dict:
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured")
        
        # Note: In google-genai 1.0.0, to enforce JSON output we should prompt it carefully or use JSON Schema if supported.
        # Ensure the prompt instructs Gemini to output raw JSON matching our expected schema.
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt
        )
        
        # Clean markdown code blocks from response (if any) and parse JSON
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(raw_text)
```

### `backend/app/schemas/analysis.py`

```python
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    journal_entries: list[dict]       # List of JournalEntry from frontend
    discipline_snapshots: list[dict]  # List of DisciplineSnapshot from frontend
    wound_tracker: dict | None

class AnalysisResponse(BaseModel):
    patterns: list[str]
    insights: list[str]
    recommendations: list[str]
    risk_level: str
    summary: str
```

### `backend/app/services/analysis_service.py`

```python
from app.core.ai import GeminiClient
from app.schemas.analysis import AnalyzeRequest, AnalysisResponse

async def perform_journal_analysis(data: AnalyzeRequest) -> AnalysisResponse:
    # 1. Format the data into a compact string to save tokens
    history_str = ... # build summary of last 30 days
    
    prompt = f"""
    You are an elite discipline AI. Analyze the user's last 30 days.
    
    DATA:
    {history_str}
    
    Return ONLY a JSON object with this shape:
    {{
      "patterns": ["str"],
      "insights": ["str"],
      "recommendations": ["str"],
      "risk_level": "low|medium|high",
      "summary": "str"
    }}
    """
    
    client = GeminiClient()
    result = await client.analyze_structured(prompt)
    return AnalysisResponse(**result)
```

### `backend/app/api/analysis.py`

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /analyze/journal` | POST | Yes | Calls `perform_journal_analysis`. Returns `AnalysisResponse`. |

## Wire into `app/main.py`

Uncomment and add:
```python
from app.api.analysis import router as analysis_router
app.include_router(analysis_router, prefix="/analyze", tags=["Analysis"])
```

## Done Criteria

Write completion report to `.agents/messages/from-agent-b4/done.md` confirming:
- Gemini API integration works.
- JSON response parsing is robust.
- Endpoint works when authenticated.
