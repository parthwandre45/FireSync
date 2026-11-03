import time
from datetime import datetime, timezone
from fastapi import APIRouter
from app.models.schemas import HealthResponse, LibraryStatus
from app.services.harmonizer import harmonizer_service
from app.db.session import check_db_health

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/health", response_model=HealthResponse)
async def get_health_status():
    """
    Returns system status, active scientific dependencies (Pandas, NumPy, GeoPandas, Shapely, SciPy),
    and database connectivity diagnostics.
    """
    uptime = time.time() - START_TIME
    lib_versions = harmonizer_service.get_library_versions()
    db_status = check_db_health()
    
    return HealthResponse(
        status="healthy",
        service="FireSync Python Scientific Processing Service",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc),
        uptime_seconds=round(uptime, 2),
        libraries=LibraryStatus(**lib_versions),
        database=db_status
    )
