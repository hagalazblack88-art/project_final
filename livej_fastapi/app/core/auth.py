from typing import Optional
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, IntegerIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    CookieTransport,  
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession
# from dotenv import load_dotenv

from app.database import get_db, engine
from app.config import settings
from app.models import User
import os

SECRET_KEY = settings.SECRET_KEY


cookie_transport = CookieTransport(
    cookie_name="fastapiusersauth", 
    cookie_max_age=3600,
    cookie_samesite="lax"
)

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET_KEY, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = SECRET_KEY
    verification_token_secret = SECRET_KEY

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"Новый пользователь: {user.email} (ID: {user.id})")
        # Здесь можно вызвать send_email(user.email, "Добро пожаловать!")

    async def on_after_forgot_password(self, user: User, token: str, request: Optional[Request] = None):
        print(f"🔑 Токен сброса для {user.email}: {token}")
        # Здесь генерируется ссылка вида /auth/reset-password?token=...


async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


fastapi_users = FastAPIUsers[User, int](get_user_manager, [auth_backend])


current_active_user = fastapi_users.current_user(active=True)