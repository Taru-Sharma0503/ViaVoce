from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """
    Confirms the AI microservice is up and reachable.
    The Node.js server pings this before routing traffic to it, and
    it's a useful first check when debugging the demo pipeline live.
    """
    return {
        "status": "ok",
        "service": "viavoce-ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
