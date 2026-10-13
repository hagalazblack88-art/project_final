from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from fastapi_users import schemas


# ==========================================
# ПОЛЬЗОВАТЕЛИ (USERS)
# ==========================================

class UserRead(schemas.BaseUser[int]):
    username: str
    model_config = ConfigDict(from_attributes=True)


class UserCreate(schemas.BaseUserCreate):
    username: str


class UserUpdate(schemas.BaseUserUpdate):
    username: str | None = None


# ==========================================
# КОММЕНТАРИИ (COMMENTS)
# ==========================================
class CommentRead(BaseModel):
    id: int
    text: str
    pub_date: datetime
    author: UserRead | None = None
    author_id: int
    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    text: str


# ==========================================
# ПОСТЫ (POSTS)
# ==========================================
class PostList(BaseModel):
    id: int
    text: str
    pub_date: datetime
    image: str | None = None
    author: UserRead
    author_id: int
    group_id: int | None = None
    comments: list[CommentRead] = []
    model_config = ConfigDict(from_attributes=True)


class PostCreate(BaseModel):
    text: str
    image: str | None = None
    group_id: int | None = None


class PostDetailResponse(BaseModel):
    post: PostList
    author_post_count: int


# ==========================================
# ПРОФИЛЬ (PROFILE)
# ==========================================
class ProfileResponse(BaseModel):
    author: UserRead
    posts: dict
    is_following: bool
    total_posts: int


# ==========================================
# СООБЩЕСТВА (GROUPS)
# ==========================================
class GroupRead(BaseModel):
    id: int
    title: str
    description: str | None = None
    slug: str
    owner_id: int | None = None
    model_config = ConfigDict(from_attributes=True)


class GroupCreate(BaseModel):
    title: str
    description: str | None = None
    slug: str | None = None