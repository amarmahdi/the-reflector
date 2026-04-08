from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.backup import router as backup_router
from app.api.analysis import router as analysis_router

app = FastAPI(title="The Reflector API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(backup_router, prefix="/backup", tags=["Backup"])
app.include_router(analysis_router, prefix="/analyze", tags=["Analysis"])

@app.get("/health")
async def health():
    return {"status": "alive", "version": "1.0.0"}
