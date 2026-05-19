import pytest
import os
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from types import SimpleNamespace

# Set environment variable for JWT handler
os.environ["SECRET_KEY"] = "test-secret-key"

# ============ AUTH ROUTER TESTS ============

def test_auth_register_success():
    """Test successful user registration endpoint"""
    from features.auth.router import router as auth_router
    
    app = FastAPI()
    app.include_router(auth_router)
    client = TestClient(app)
    
    with patch("features.auth.router.auth_service.register") as mock_register:
        mock_register.return_value = (
            "fake-access",
            "fake-refresh",
            {"id": 1, "username": "testuser", "createdAt": "2024-01-01"}
        )
        
        response = client.post("/auth/register", json={
            "username": "testuser",
            "password": "Test123!",
        })
        
        assert response.status_code == 201
        assert "JWT" in response.json()


def test_auth_login_success():
    """Test successful login endpoint"""
    from features.auth.router import router as auth_router
    
    app = FastAPI()
    app.include_router(auth_router)
    client = TestClient(app)
    
    with patch("features.auth.router.auth_service.login") as mock_login:
        mock_login.return_value = (
            "fake-access",
            "fake-refresh",
            {"id": 1, "username": "testuser", "createdAt": "2024-01-01"}
        )
        
        response = client.post("/auth/login", json={
            "username": "testuser",
            "password": "Test123!",
        })
        
        assert response.status_code == 200
        assert "JWT" in response.json()


def test_auth_login_invalid():
    """Test login with invalid credentials"""
    from features.auth.router import router as auth_router
    
    app = FastAPI()
    app.include_router(auth_router)
    client = TestClient(app)
    
    with patch("features.auth.router.auth_service.login") as mock_login:
        mock_login.side_effect = ValueError("Invalid credentials")
        
        response = client.post("/auth/login", json={
            "username": "testuser",
            "password": "wrong",
        })
        
        assert response.status_code == 401


def test_auth_refresh_success():
    """Test token refresh endpoint"""
    from features.auth.router import router as auth_router
    
    app = FastAPI()
    app.include_router(auth_router)
    client = TestClient(app)
    
    with patch("features.auth.router.auth_service.refresh") as mock_refresh:
        mock_refresh.return_value = "new-access-token"
        
        response = client.post("/auth/refresh", json={
            "refresh_token": "valid-refresh-token",
        })
        
        assert response.status_code == 200
        assert response.json()["JWT"] == "new-access-token"


# ============ GROUP ROUTER TESTS ============

def test_group_create_success():
    """Test creating a group endpoint"""
    from features.group.router import router as group_router
    from features.auth.utils import get_current_user
    
    app = FastAPI()
    
    async def mock_get_current_user():
        return 1
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.include_router(group_router)
    client = TestClient(app)
    
    with patch("features.group.router.service.create_group") as mock_create:
        mock_create.return_value = SimpleNamespace(
            id=1,
            name="Test Group",
        )
        
        response = client.post("/group/create", json={
            "name": "Test Group",
            "description": "Test",
            "visibility": "PRIVATE",
        })
        
        assert response.status_code == 201


def test_group_list_success():
    """Test listing groups endpoint"""
    from features.group.router import router as group_router
    from features.auth.utils import get_current_user
    
    app = FastAPI()
    
    async def mock_get_current_user():
        return 1
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.include_router(group_router)
    client = TestClient(app)
    
    with patch("features.group.router.service.list_groups") as mock_list:
        mock_list.return_value = [
            SimpleNamespace(id=1, name="Group 1"),
            SimpleNamespace(id=2, name="Group 2"),
        ]
        
        response = client.get("/group/")
        
        assert response.status_code == 200


def test_group_delete_success():
    """Test deleting group endpoint"""
    from features.group.router import router as group_router
    from features.auth.utils import get_current_user
    
    app = FastAPI()
    
    async def mock_get_current_user():
        return 1
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.include_router(group_router)
    client = TestClient(app)
    
    with patch("features.group.router.service.delete_group"):
        response = client.delete("/group/1")
        
        assert response.status_code == 204


# ============ POST ROUTER TESTS ============

def test_post_get_posts_success():
    """Test getting posts endpoint"""
    from features.post.router import router as post_router
    from features.auth.utils import get_current_user
    
    app = FastAPI()
    
    async def mock_get_current_user():
        return 1
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.include_router(post_router)
    client = TestClient(app)
    
    with patch("features.post.router.service.get_posts") as mock_get:
        mock_get.return_value = {
            "page": 1,
            "pageSize": 10,
            "total": 1,
            "totalPages": 1,
            "posts": [
                {
                    "id": 1,
                    "content": "Post 1",
                    "createdAt": "2024-01-01T00:00:00",
                    "authorId": 2,
                    "groupId": 1,
                    "author": {"id": 2, "username": "user2", "createdAt": "2024-01-01T00:00:00"},
                    "images": [],
                    "ratings": [],
                    "likes": {"totalLikes": 0, "hasLiked": False},
                    "commentCount": 0,
                }
            ]
        }
        
        response = client.get("/posts/1?page=1&page_size=10")
        
        assert response.status_code == 200


def test_post_toggle_like_success():
    """Test toggling like endpoint"""
    from features.post.router import router as post_router
    from features.auth.utils import get_current_user
    
    app = FastAPI()
    
    async def mock_get_current_user():
        return 1
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.include_router(post_router)
    client = TestClient(app)
    
    with patch("features.post.router.service.toggle_like") as mock_like:
        mock_like.return_value = {"liked": True}
        
        response = client.post("/posts/1/like")
        
        assert response.status_code == 200
        assert response.json()["liked"] is True


def test_post_delete_success():
    """Test deleting post endpoint"""
    from features.post.router import router as post_router
    from features.auth.utils import get_current_user
    
    app = FastAPI()
    
    async def mock_get_current_user():
        return 1
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.include_router(post_router)
    client = TestClient(app)
    
    with patch("features.post.router.service.delete_post"):
        response = client.delete("/posts/1")
        
        assert response.status_code == 204


def test_post_rate_post_success():
    """Test rating post endpoint"""
    from features.post.router import router as post_router
    from features.auth.utils import get_current_user
    
    app = FastAPI()
    
    async def mock_get_current_user():
        return 1
    
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.include_router(post_router)
    client = TestClient(app)
    
    with patch("features.post.router.service.rate_post") as mock_rate:
        mock_rate.return_value = [SimpleNamespace(score=8)]
        
        response = client.post("/posts/1/rate", json={
            "ratings": [
                {"category": "Technique", "score": 4},
                {"category": "Creativity", "score": 5},
                {"category": "Composition", "score": 3},
            ]
        })
        
        assert response.status_code == 200
        mock_rate.assert_called_once()

