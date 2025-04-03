import logging

from fastapi import APIRouter, Request

from api.models.users import UserInfo

logger = logging.getLogger(__name__)

def register_routes(app):
    router = APIRouter(prefix="/api/user", tags=["user"])

    @router.get("/info", response_model=UserInfo)
    async def get_user_info(request: Request):
        """Get information about the current user from request headers"""
        headers = request.headers
        logger.info("Received request for user information")

        user_info = UserInfo(
            email=headers.get("X-Forwarded-Email"),
            username=headers.get("X-Forwarded-Preferred-Username"),
            user=headers.get("X-Forwarded-User"),
            ip=headers.get("X-Real-Ip")
        )

        logger.info(f"User information retrieved: email={user_info.email}, username={user_info.username}, user={user_info.user}, ip={user_info.ip}")
        return user_info

    app.include_router(router)
