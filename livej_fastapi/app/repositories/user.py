from sqlalchemy import select, func, delete
from sqlalchemy.orm import joinedload, selectinload # 🔥 Добавили selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Post, Follow, Comment # 🔥 Добавили Comment


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        return await self.session.scalar(stmt)

    async def get_posts_by_author(self, author_id: int) -> list:
        # 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем подгрузку комментариев и их авторов
        stmt = (
            select(Post)
            .options(
                joinedload(Post.author),
                selectinload(Post.comments).options(joinedload(Comment.author))
            )
            .where(Post.author_id == author_id)
            .order_by(Post.pub_date.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().unique().all()

    async def count_posts_by_author(self, author_id: int) -> int:
        stmt = select(func.count(Post.id)).where(Post.author_id == author_id)
        return await self.session.scalar(stmt) or 0

    async def is_following(self, user_id: int, author_id: int) -> bool:
        stmt = select(Follow.id).where(Follow.user_id == user_id, Follow.author_id == author_id)
        return (await self.session.scalar(stmt)) is not None

    async def add_follow(self, user_id: int, author_id: int) -> None:
        self.session.add(Follow(user_id=user_id, author_id=author_id))
        await self.session.commit()

    async def remove_follow(self, user_id: int, author_id: int) -> None:
        await self.session.execute(
            delete(Follow).where(Follow.user_id == user_id, Follow.author_id == author_id)
        )
        await self.session.commit()