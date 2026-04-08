"""
Pydantic schemas for AI journal analysis.
"""

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Payload sent by the mobile app for AI analysis."""

    journal_entries: list[dict] = Field(
        ...,
        description="Array of journal entry objects from the last 30 days",
    )
    discipline_snapshots: list[dict] = Field(
        ...,
        description="Array of daily discipline score snapshots",
    )
    wound_tracker: dict | None = Field(
        default=None,
        description="Current wound tracker state (missed days, penalties)",
    )


class AnalysisResponse(BaseModel):
    """Structured insights returned by Gemini."""

    patterns: list[str] = Field(
        ...,
        description="Recurring failure/success patterns detected",
    )
    insights: list[str] = Field(
        ...,
        description="Deep observations about the user's behaviour",
    )
    recommendations: list[str] = Field(
        ...,
        description="Actionable steps for improvement",
    )
    risk_level: str = Field(
        ...,
        description="Overall risk: low, medium, or high",
    )
    summary: str = Field(
        ...,
        description="1-2 sentence executive summary",
    )
