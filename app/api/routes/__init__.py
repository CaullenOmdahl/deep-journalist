from fastapi import APIRouter
from .articles import router as articles_router
from .health import router as health_router

router = APIRouter()
router.include_router(articles_router, prefix="/articles", tags=["articles"])
router.include_router(health_router, prefix="/health", tags=["health"]) 