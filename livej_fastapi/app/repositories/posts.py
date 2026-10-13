from sqlalchemy import select, desc, func, delete
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate

from app.models import Post, User, Comment, Group, Follow


class PostRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_feed(self, q: str | None = None) -> Page:
        stmt = (
            select(Post)
            .options(
                joinedload(Post.author),
                selectinload(Post.comments).options(joinedload(Comment.author)) # 🔥 Подгружаем комментарии с авторами
            )
            .order_by(desc(Post.pub_date))
        )
        if q:
            stmt = stmt.where(Post.text.ilike(f"%{q}%"))
        return await paginate(self.session, stmt)      

    async def get_follow_feed(self, user_id: int) -> Page:
        stmt = (
            select(Post)
            .join(Follow, Post.author_id == Follow.author_id)
            .where(Follow.user_id == user_id)
            .options(
                joinedload(Post.author),
                selectinload(Post.comments).options(joinedload(Comment.author))
            )
            .order_by(desc(Post.pub_date))
        )
        return await paginate(self.session, stmt)

    async def get_group_posts(self, group_id: int) -> Page:
        stmt = (
            select(Post)
            .options(
                joinedload(Post.author),
                selectinload(Post.comments).options(joinedload(Comment.author))
            )
            .where(Post.group_id == group_id)
            .order_by(desc(Post.pub_date))
        )
        return await paginate(self.session, stmt)

    async def get_by_id(self, post_id: int) -> Post | None:
        stmt = select(Post).where(Post.id == post_id)
        return await self.session.scalar(stmt)

    async def get_detail_by_id(self, post_id: int) -> Post | None:
        stmt = (
            select(Post)
            .options(
                joinedload(Post.author),
                joinedload(Post.group),
                selectinload(Post.comments).options(joinedload(Comment.author))
            )
            .where(Post.id == post_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_author_post_count(self, author_id: int) -> int:
        stmt = select(func.count(Post.id)).where(Post.author_id == author_id)
        return await self.session.scalar(stmt) or 0

    # 🔥 МЕТОД CREATE: Принимает готовый объект Post, а не отдельные аргументы
    async def create(self, post: Post) -> Post:
        self.session.add(post)
        await self.session.commit()
        
        # Возвращаем пост с загруженным автором и комментариями (чтобы Pydantic не ругался)
        stmt = (
            select(Post)
            .options(
                joinedload(Post.author),
                selectinload(Post.comments)
            )
            .where(Post.id == post.id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def update(self, post: Post, update_data: dict) -> Post:
        for field, value in update_data.items():
            setattr(post, field, value)
        await self.session.commit()
        await self.session.refresh(post)
        return post

    async def delete(self, post: Post) -> None:
        await self.session.delete(post)
        await self.session.commit()

    async def add_comment(self, post_id: int, author_id: int, text: str) -> Comment:
        comment = Comment(text=text, post_id=post_id, author_id=author_id)
        self.session.add(comment)
        await self.session.commit()
        
        stmt = (
            select(Comment)
            .options(joinedload(Comment.author))
            .where(Comment.id == comment.id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_comment_by_id(self, comment_id: int) -> Comment | None:
        stmt = (
            select(Comment)
            .options(joinedload(Comment.author))
            .where(Comment.id == comment_id)
        )
        return await self.session.scalar(stmt)

    async def delete_comment(self, comment: Comment) -> None:
        await self.session.delete(comment)
        await self.session.commit()