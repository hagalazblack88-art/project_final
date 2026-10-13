import traceback

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi_pagination import Page
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.schemas import UserRead, PostCreate, PostList, PostDetailResponse, CommentCreate, CommentRead, GroupRead, ProfileResponse
from app.dependencies import get_post_service, get_user_service, get_group_service
from app.services.post import PostService
from app.services.user import UserService
from app.services.group import GroupService
from app.core.auth import current_active_user
from app.database import get_db
from app.exceptions import (
    PostNotFoundError, 
    PermissionDeniedError, 
    GroupNotFoundError, 
    UserNotFoundError, 
    CannotFollowSelfError
)

router = APIRouter(tags=["posts"])

def handle_domain_exception(exc: Exception):
    # 🔥 Печатает точную ошибку в терминал для отладки
    print("\n" + "="*60)
    print("🚨 ТОЧНАЯ ОШИБКА СЕРВЕРА:")
    traceback.print_exc()
    print("="*60 + "\n")
    
    if isinstance(exc, (PostNotFoundError, UserNotFoundError, GroupNotFoundError)):
        raise HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, PermissionDeniedError):
        raise HTTPException(status_code=403, detail=str(exc))
    if isinstance(exc, CannotFollowSelfError):
        raise HTTPException(status_code=400, detail=str(exc))
    
    raise HTTPException(status_code=500, detail=f"Внутренняя ошибка: {str(exc)}")


# --- ЛЕНТЫ ---
@router.get("/posts/", response_model=Page[PostList])
async def index(
    q: Optional[str] = Query(None, description="Поиск по тексту"),
    service: PostService = Depends(get_post_service)
):
    try:
        return await service.get_feed(q)
    except Exception as e:
        handle_domain_exception(e)

@router.get("/follow/", response_model=Page[PostList])
async def follow_index(
    service: PostService = Depends(get_post_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.get_follow_feed(current_user)
    except Exception as e:
        handle_domain_exception(e)


# --- ГРУППЫ ---
# --- СОЗДАНИЕ СООБЩЕСТВА ---
class GroupCreate(BaseModel):
    title: str
    description: str | None = None
    slug: str | None = None

@router.post("/groups/", response_model=GroupRead, status_code=201)
async def create_group(
    form: GroupCreate,
    service: GroupService = Depends(get_group_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.create_group(current_user, form)
    except Exception as e:
        handle_domain_exception(e)
        
@router.get("/groups/", response_model=list[GroupRead])
async def list_groups(service: GroupService = Depends(get_group_service)):
    try:
        return await service.get_all_groups()
    except Exception as e:
        handle_domain_exception(e)

@router.get("/groups/{slug}/", response_model=dict)
async def group_posts(
    slug: str,
    service: PostService = Depends(get_post_service)
):
    try:
        return await service.get_group_posts(slug)
    except Exception as e:
        handle_domain_exception(e)


# --- CRUD ПОСТОВ ---
@router.post("/posts/", response_model=PostList, status_code=201)
async def create_post(
    form: PostCreate,
    service: PostService = Depends(get_post_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.create_post(current_user, form)
    except Exception as e:
        handle_domain_exception(e)

@router.get("/posts/{post_id}", response_model=PostDetailResponse)
async def post_detail(
    post_id: int, 
    service: PostService = Depends(get_post_service)
):
    try:
        return await service.get_post_detail(post_id)
    except Exception as e:
        handle_domain_exception(e)

@router.patch("/posts/{post_id}/", response_model=PostList)
async def edit_post(
    post_id: int,
    form: PostCreate,
    service: PostService = Depends(get_post_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.edit_post(current_user, post_id, form)
    except Exception as e:
        handle_domain_exception(e)

@router.delete("/posts/{post_id}/", status_code=204)
async def delete_post(
    post_id: int,
    service: PostService = Depends(get_post_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.delete_post(current_user, post_id)
    except Exception as e:
        handle_domain_exception(e)


# --- КОММЕНТАРИИ ---
@router.post("/posts/{post_id}/comments/", response_model=CommentRead, status_code=201)
async def add_comment(
    post_id: int,
    form: CommentCreate,
    service: PostService = Depends(get_post_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.add_comment(current_user, post_id, form)
    except Exception as e:
        handle_domain_exception(e)

@router.delete("/posts/{post_id}/comments/{comment_id}/", status_code=204)
async def delete_comment(
    post_id: int,
    comment_id: int,
    service: PostService = Depends(get_post_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.delete_comment(current_user, comment_id)
    except Exception as e:
        handle_domain_exception(e)


# --- ПРОФИЛИ И ПОДПИСКИ ---
@router.get("/profile/me", response_model=ProfileResponse) # 🔥 ВЕРНУЛИ response_model
async def my_profile(
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.get_profile(None, current_user)
    except Exception as e:
        handle_domain_exception(e)

@router.get("/profile/{username}", response_model=ProfileResponse) # 🔥 ВЕРНУЛИ response_model
async def user_profile(
    username: str,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.get_profile(username, current_user)
    except Exception as e:
        handle_domain_exception(e)

@router.post("/profile/{username}/follow/", status_code=201)
async def follow_user(
    username: str,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.follow_user(current_user, username)
    except Exception as e:
        handle_domain_exception(e)

@router.delete("/profile/{username}/follow/", status_code=200)
async def unfollow_user(
    username: str,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(current_active_user)
):
    try:
        return await service.unfollow_user(current_user, username)
    except Exception as e:
        handle_domain_exception(e)


# --- СМЕНА ИМЕНИ ПОЛЬЗОВАТЕЛЯ ---
class UsernameUpdate(BaseModel):
    username: str

@router.patch("/users/me/username", response_model=UserRead)
async def update_my_username(
    form: UsernameUpdate,
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db)
):
    new_username = form.username.strip().lower()
    
    if not new_username:
        raise HTTPException(status_code=400, detail="Имя пользователя не может быть пустым")
    
    if len(new_username) < 3:
        raise HTTPException(status_code=400, detail="Имя пользователя должно быть не менее 3 символов")

    existing_user = await db.scalar(select(User).where(User.username == new_username))
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(status_code=400, detail="Это имя пользователя уже занято")

    current_user.username = new_username
    await db.commit()
    await db.refresh(current_user)
    
    return current_user