"""
Gemini AI client wrapper for structured JSON analysis.
"""

import json
import re
from google import genai
from app.config import get_settings


class GeminiClient:
    """Async wrapper around Google Gemini for structured JSON generation."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def analyze_structured(self, prompt: str) -> dict:
        """Send a prompt to Gemini and parse the JSON response."""
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured")

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        raw_text = response.text

        # Strip markdown code fences (```json ... ``` or ``` ... ```)
        raw_text = re.sub(r"^```(?:json)?\s*\n?", "", raw_text, flags=re.MULTILINE)
        raw_text = re.sub(r"\n?```\s*$", "", raw_text, flags=re.MULTILINE)
        raw_text = raw_text.strip()

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Gemini returned invalid JSON: {exc}\n\nRaw response:\n{raw_text}"
            )
