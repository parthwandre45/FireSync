import logging
from typing import Dict, Any
import psycopg2
from app.core.config import settings

logger = logging.getLogger("firesync.db")

def check_db_health() -> Dict[str, Any]:
    """
    Validates PostgreSQL and PostGIS connectivity.
    Returns status and diagnostic details.
    """
    try:
        conn = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            connect_timeout=3
        )
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            pg_version = cur.fetchone()[0]
            
            # Check PostGIS extension
            try:
                cur.execute("SELECT PostGIS_Version();")
                postgis_version = cur.fetchone()[0]
            except Exception:
                postgis_version = "PostGIS extension not enabled or initialized"

        conn.close()
        return {
            "status": "connected",
            "database": settings.DB_NAME,
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "postgres_version": pg_version,
            "postgis_version": postgis_version
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "database": settings.DB_NAME,
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "error": str(e),
            "note": "Database server may not be started or credentials require verification in .env"
        }
