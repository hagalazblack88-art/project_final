from sqlalchemy import select, func, delete
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Post, Follow
from app.schemas import PostList # 🔥 ДОБАВИЛИ ЭТОТ ИМПОРТ
from app.exceptions import UserNotFoundError, CannotFollowSelfError


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        return await self.session.scalar(stmt)

    async def get_posts_by_author(self, author_id: int) -> list:
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


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_profile(self, target_username: str | None, current_user: User) -> dict:
        if not target_username:
            target_username = current_user.username
            
        author = await self.user_repo.get_by_username(target_username)
        if not author:
            raise UserNotFoundError("Пользователь не найден")

        posts_list = await self.user_repo.get_posts_by_author(author.id)
        total_posts = await self.user_repo.count_posts_by_author(author.id)
        
        # 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Преобразуем SQLAlchemy объекты в словари через Pydantic
        serialized_posts = [PostList.model_validate(post).model_dump() for post in posts_list]
        
        safe_size = len(serialized_posts) if len(serialized_posts) > 0 else 1
        
        posts_page = {
            "items": serialized_posts, # Теперь здесь безопасные словари, а не объекты БД
            "total": total_posts,
            "page": 1,
            "size": safe_size,
            "pages": 1 if total_posts == 0 else (total_posts // safe_size) + 1
        }

        is_following = False
        if current_user.id != author.id:
            is_following = await self.user_repo.is_following(current_user.id, author.id)

        return {
            "author": author, # С этим Pydantic справится сам благодаря from_attributes=True
            "posts": posts_page,
            "is_following": is_following,
            "total_posts": total_posts
        }

    async def follow_user(self, current_user: User, target_username: str) -> dict:
        if current_user.username == target_username:
            raise CannotFollowSelfError("Нельзя подписаться на себя")
            
        author = await self.user_repo.get_by_username(target_username)
        if not author:
            raise UserNotFoundError("Пользователь не найден")
            
        await self.user_repo.add_follow(current_user.id, author.id)
        return {"status": "success"}

    async def unfollow_user(self, current_user: User, target_username: str) -> dict:
        author = await self.user_repo.get_by_username(target_username)
        if not author:
            raise UserNotFoundError("Пользователь не найден")
            
        await self.user_repo.remove_follow(current_user.id, author.id)
        return {"status": "success"}