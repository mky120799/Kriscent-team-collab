from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import AppSettings, get_current_user
from app.schemas.assistant import ParseCommandRequest
from app.services.assistant import fallback_parse, parse_with_gemini

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/parse", dependencies=[Depends(get_current_user)])
async def parse_command(
    payload: ParseCommandRequest,
    settings: AppSettings,
):
    """Turn a natural-language command like "move task Login page to done" into a task action."""
    prompt = payload.prompt
    if not prompt or not isinstance(prompt, str):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or missing prompt")

    if settings.gemini_api_key:
        parsed = await parse_with_gemini(prompt, settings.gemini_api_key)
        if parsed is not None:
            return parsed

    return fallback_parse(prompt)
