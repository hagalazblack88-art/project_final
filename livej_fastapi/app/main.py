from fastapi import FastAPI
from fastapi_pagination import add_pagination 
from fastapi.middleware.cors import CORSMiddleware
from app.routers import posts_django, groups, comments
from app.routers.auth_users import router as auth_users_router
from app.database import engine, Base


async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="livej_fastAPI", lifespan=lifespan)


origins = [
    "http://127.0.0.1",
    "http://127.0.0.1:80",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://localhost:80",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_users_router)
app.include_router(posts_django.router)
app.include_router(groups.router)
app.include_router(comments.router)


add_pagination(app)
