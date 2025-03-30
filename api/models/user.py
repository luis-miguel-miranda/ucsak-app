from pydantic import BaseModel

class UserInfo(BaseModel):
    """Model representing user information from request headers"""
    email: str | None
    username: str | None
    user: str | None
    ip: str | None 