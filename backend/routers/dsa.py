from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_placeholder():
    return {"message": "Endpoint under development"}
