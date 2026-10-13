from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Post, User, Comment, Group, Follow
from app.schemas import PostCreate, CommentCreate
from app.exceptions import PostNotFoundError, PermissionDeniedError, GroupNotFoundError


class PostService:
    # 🔥 ИСПРАВЛЕНИЕ: Добавили group_repo, чтобы соответствовать dependencies.py
    def __init__(self, post_repo, group_repo):
        self.post_repo = post_repo
        self.group_repo = group_repo

    async def get_feed(self, q: str | None = None):
        return await self.post_repo.get_feed(q)

    async def get_follow_feed(self, current_user: User):
        return await self.post_repo.get_follow_feed(current_user.id)

    async def get_group_posts(self, slug: str):
        # Сначала находим группу по slug через репозиторий групп (или постов, если там есть session)
        group = await self.post_repo.session.scalar(
            select(Group).where(Group.slug == slug)
        )
        if not group:
            raise GroupNotFoundError("Сообщество не найдено")
        return await self.post_repo.get_group_posts(group.id)

    async def create_post(self, current_user: User, form: PostCreate) -> Post:
        new_post = Post(
            text=form.text,
            image=form.image,
            group_id=form.group_id,
            author_id=current_user.id
        )
        return await self.post_repo.create(new_post)

    async def get_post_detail(self, post_id: int) -> dict:
        post = await self.post_repo.get_detail_by_id(post_id)
        if not post:
            raise PostNotFoundError("Пост не найден")
            
        author_post_count = await self.post_repo.get_author_post_count(post.author_id)
        return {"post": post, "author_post_count": author_post_count}

    async def edit_post(self, current_user: User, post_id: int, form: PostCreate) -> Post:
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError("Пост не найден")
        if post.author_id != current_user.id:
            raise PermissionDeniedError("Вы можете редактировать только свои посты")
            
        update_data = form.model_dump(exclude_unset=True)
        return await self.post_repo.update(post, update_data)

    async def delete_post(self, current_user: User, post_id: int) -> dict:
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError("Пост не найден")
        if post.author_id != current_user.id:
            raise PermissionDeniedError("Вы можете удалять только свои посты")
            
        await self.post_repo.delete(post)
        return {"status": "success"}

    async def add_comment(self, current_user: User, post_id: int, form: CommentCreate) -> Comment:
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError("Пост не найден")
            
        return await self.post_repo.add_comment(post_id, current_user.id, form.text)

    async def delete_comment(self, current_user: User, comment_id: int) -> dict:
        comment = await self.post_repo.get_comment_by_id(comment_id)
        if not comment:
            raise PostNotFoundError("Комментарий не найден")
        if comment.author_id != current_user.id:
            raise PermissionDeniedError("Вы можете удалять только свои комментарии")
            
        await self.post_repo.delete_comment(comment)
        return {"status": "success"}