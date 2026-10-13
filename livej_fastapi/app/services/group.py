import re
from fastapi import HTTPException
from app.models import User, Group

class GroupService:
    def __init__(self, group_repo):
        self.group_repo = group_repo

    async def get_all_groups(self):
        return await self.group_repo.get_all()

    async def create_group(self, current_user: User, form) -> Group:
        # 🔥 Генерируем slug из названия, если он не указан вручную
        slug = form.slug or re.sub(r'[^a-z0-9]+', '-', form.title.lower()).strip('-')
        
        # 🔥 Проверяем уникальность slug (адреса сообщества)
        existing = await self.group_repo.get_by_slug(slug)
        if existing:
            raise HTTPException(status_code=400, detail="Сообщество с таким названием уже существует")
        
        # Создаем новый объект группы
        new_group = Group(
            title=form.title,
            description=form.description or "",
            slug=slug,
            owner_id=current_user.id
        )
        
        return await self.group_repo.create(new_group)