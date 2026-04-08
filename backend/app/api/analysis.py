"""
Analysis API — Gemini-powered journal analysis endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.analysis import AnalyzeRequest, AnalysisResponse
from app.services.analysis_service import perform_journal_analysis

router = APIRouter()


@router.post("/journal", response_model=AnalysisResponse, status_code=200)
async def analyze_journal(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Analyze the authenticated user's journal entries and discipline data
    using Gemini AI.  Returns structured patterns, insights, and recommendations.
    """
    try:
        result = await perform_journal_analysis(body)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(exc)}",
        )
