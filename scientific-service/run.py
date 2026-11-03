import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    print(f"Starting FireSync Scientific Service on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
