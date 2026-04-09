"""
Journal analysis service — compresses user data into a token-efficient prompt,
calls Gemini, and returns a structured AnalysisResponse.
"""

import json
from app.core.ai import GeminiClient
from app.schemas.analysis import AnalyzeRequest, AnalysisResponse


def _compress_journal_entries(entries: list[dict]) -> str:
    """Build a compact summary of journal entries to save tokens."""
    if not entries:
        return "No journal entries provided."

    lines: list[str] = []
    for e in entries:
        date = e.get("date", "unknown")
        mood = e.get("mood", "?")
        body = e.get("body", e.get("text", e.get("content", "")))
        # Truncate very long entries to keep prompt size reasonable
        if body and len(body) > 300:
            body = body[:300] + "…"
        failure_reason = e.get("failureReason", e.get("failure_reason", ""))
        parts = [f"[{date}] mood={mood}"]
        if failure_reason:
            parts.append(f"fail_reason=\"{failure_reason}\"")
        if body:
            parts.append(f"text=\"{body}\"")
        lines.append(" | ".join(parts))

    return "\n".join(lines)


def _compress_discipline_snapshots(snapshots: list[dict]) -> str:
    """Build a compact summary of discipline snapshots."""
    if not snapshots:
        return "No discipline snapshots provided."

    lines: list[str] = []
    for s in snapshots:
        date = s.get("date", "unknown")
        score = s.get("score", s.get("composite", "?"))
        breakdown = s.get("breakdown", {})

        parts = [f"[{date}] score={score}"]
        if breakdown:
            sub_scores = ", ".join(f"{k}={v}" for k, v in breakdown.items())
            parts.append(f"({sub_scores})")
        lines.append(" ".join(parts))

    return "\n".join(lines)


def _compress_wound_tracker(wound: dict | None) -> str:
    """Summarize wound tracker data."""
    if not wound:
        return "No wound data."
    return json.dumps(wound, separators=(",", ":"))


def _build_prompt(data: AnalyzeRequest) -> str:
    """Assemble the full Gemini prompt from compressed user data."""
    journal_block = _compress_journal_entries(data.journal_entries)
    discipline_block = _compress_discipline_snapshots(data.discipline_snapshots)
    wound_block = _compress_wound_tracker(data.wound_tracker)

    return f"""You are an elite discipline analyst AI for a personal accountability app called "The Reflector".

Analyze the user's last 30 days of journal entries and discipline scores below.
Your job:
1. Find recurring failure patterns (e.g. "You fail Mondays 60% of the time", "Your discipline drops every weekend").
2. Cross-reference mood, failure reasons, and discipline sub-score breakdowns to surface root causes.
3. Identify risk signals — if the user is trending toward burnout or stagnation.
4. Give actionable, specific recommendations (not generic self-help advice).

=== JOURNAL ENTRIES ===
{journal_block}

=== DISCIPLINE SNAPSHOTS ===
{discipline_block}

=== WOUND TRACKER ===
{wound_block}

Return ONLY a valid JSON object with exactly this shape — no markdown, no explanation, just JSON:
{{
  "patterns": ["string — each a specific pattern found"],
  "insights": ["string — each a deeper observation"],
  "recommendations": ["string — each actionable and specific"],
  "risk_level": "low | medium | high",
  "summary": "1-2 sentence executive summary of the analysis"
}}"""


async def perform_journal_analysis(data: AnalyzeRequest) -> AnalysisResponse:
    """Compress user data, call Gemini, parse and return structured response."""
    client = GeminiClient()

    if data.prompt_override:
        # Custom prompt mode — append compressed data and expect a simple text response
        journal_block = _compress_journal_entries(data.journal_entries)
        custom_prompt = f"""{data.prompt_override}

=== USER DATA ===
{journal_block}
"""
        raw_text = await client.generate_text(custom_prompt)
        # Wrap the raw text into an AnalysisResponse shape
        return AnalysisResponse(
            patterns=[],
            insights=[],
            recommendations=[],
            risk_level="low",
            summary=raw_text.strip(),
        )

    prompt = _build_prompt(data)
    result = await client.analyze_structured(prompt)
    return AnalysisResponse(**result)
