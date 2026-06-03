import pytest
from unittest.mock import AsyncMock, MagicMock
from types import SimpleNamespace
from features.post.service import PostService, _aggregate_ratings


@pytest.fixture
def mock_image_handler():
    handler = MagicMock()
    handler.save = AsyncMock()
    handler.delete = MagicMock()
    return handler


@pytest.fixture
def mock_db():
    db = SimpleNamespace(
        post=SimpleNamespace(
            find_unique=AsyncMock(),
            find_many=AsyncMock(),
            count=AsyncMock(),
            create=AsyncMock(),
            delete=AsyncMock(),
        ),
        groupmember=SimpleNamespace(
            find_unique=AsyncMock(),
        ),
        group=SimpleNamespace(
            find_unique=AsyncMock(),
        ),
        postlike=SimpleNamespace(
            find_unique=AsyncMock(),
            create=AsyncMock(),
            delete=AsyncMock(),
        ),
        postrating=SimpleNamespace(
            upsert=AsyncMock(),
        ),
        postcomment=SimpleNamespace(
            find_many=AsyncMock(),
            create=AsyncMock(),
        ),
        ratingcategory=SimpleNamespace(
            find_unique=AsyncMock(),
        ),
    )
    return db


@pytest.fixture
def post_service(mock_db, mock_image_handler):
    return PostService(mock_db, mock_image_handler)


# ============ get_posts ============

@pytest.mark.asyncio
async def test_get_posts_success(post_service, mock_db):
    """Test getting posts for a group user is member of"""
    mock_db.groupmember.find_unique.return_value = MagicMock()  # User is member
    
    mock_post = SimpleNamespace(
        id=1,
        content="Test post",
        authorId=2,
        groupId=1,
        createdAt="2024-01-01",
        dict=lambda: {"id": 1, "content": "Test post"},
        ratings=[],
        likes=[],
        comments=[],
    )
    mock_db.post.find_many.return_value = [mock_post]
    mock_db.post.count.return_value = 1

    result = await post_service.get_posts(user_id=1, group_id=1, page=1, page_size=10)

    assert result["page"] == 1
    assert result["total"] == 1
    assert len(result["posts"]) == 1
    assert result["posts"][0]["ratings"] == []
    mock_db.groupmember.find_unique.assert_called_once()


@pytest.mark.asyncio
async def test_get_posts_user_not_member(post_service, mock_db):
    """Test get_posts raises error when user is not member"""
    mock_db.groupmember.find_unique.return_value = None

    with pytest.raises(ValueError, match="not a member"):
        await post_service.get_posts(user_id=1, group_id=1, page=1, page_size=10)


@pytest.mark.asyncio
async def test_get_posts_pagination(post_service, mock_db):
    """Test pagination calculation"""
    mock_db.groupmember.find_unique.return_value = MagicMock()
    
    mock_post = SimpleNamespace(
        dict=lambda: {"id": 1},
        ratings=[],
        likes=[],
        comments=[],
    )
    mock_db.post.find_many.return_value = [mock_post] * 5
    mock_db.post.count.return_value = 25

    result = await post_service.get_posts(user_id=1, group_id=1, page=3, page_size=10)

    assert result["totalPages"] == 3
    mock_db.post.find_many.assert_called_once()
    call_kwargs = mock_db.post.find_many.call_args[1]
    assert call_kwargs["skip"] == 20  # (3-1) * 10


# ============ make_post ============

@pytest.mark.asyncio
async def test_make_post_success(post_service, mock_db, mock_image_handler):
    """Test creating post successfully"""
    mock_db.groupmember.find_unique.return_value = MagicMock()
    mock_image_handler.save.return_value = "http://example.com/img.jpg"
    
    mock_post = SimpleNamespace(
        id=1,
        content="New post",
        authorId=1,
        groupId=1,
        images=[],
    )
    mock_db.post.create.return_value = mock_post

    result = await post_service.make_post(
        user_id=1,
        group_id=1,
        content="New post",
        images=["file1.jpg"],
        visibility="private",
    )

    assert result.id == 1
    mock_image_handler.save.assert_called_once()
    mock_db.post.create.assert_called_once()


@pytest.mark.asyncio
async def test_make_post_user_not_member(post_service, mock_db, mock_image_handler):
    """Test make_post raises error when user not member"""
    mock_db.groupmember.find_unique.return_value = None
    mock_image_handler.save.return_value = "http://example.com/img.jpg"

    with pytest.raises(ValueError, match="not a member"):
        await post_service.make_post(
            user_id=1,
            group_id=1,
            content="Post",
            images=["file1.jpg"],
            visibility="private",
        )

    # Should clean up saved images
    mock_image_handler.delete.assert_called_once()


@pytest.mark.asyncio
async def test_make_post_no_images(post_service, mock_db):
    """Test make_post without images"""
    mock_db.groupmember.find_unique.return_value = MagicMock()
    
    mock_post = SimpleNamespace(
        id=2,
        content="Text only",
        images=[],
    )
    mock_db.post.create.return_value = mock_post

    result = await post_service.make_post(
        user_id=1,
        group_id=1,
        content="Text only",
        images=[],
        visibility="private",
    )

    assert result.id == 2


# ============ delete_post ============

@pytest.mark.asyncio
async def test_delete_post_author_can_delete(post_service, mock_db, mock_image_handler):
    """Test post author can delete"""
    mock_post = SimpleNamespace(
        id=1,
        authorId=1,
        groupId=1,
        images=[SimpleNamespace(url="http://example.com/img.jpg")],
        group=SimpleNamespace(members=[]),
    )
    mock_db.post.find_unique.return_value = mock_post

    await post_service.delete_post(user_id=1, post_id=1)

    mock_db.post.delete.assert_called_once()
    mock_image_handler.delete.assert_called_once_with("http://example.com/img.jpg")


@pytest.mark.asyncio
async def test_delete_post_owner_can_delete(post_service, mock_db, mock_image_handler):
    """Test group owner can delete other's post"""
    member = SimpleNamespace(userId=2, role="OWNER")
    mock_post = SimpleNamespace(
        id=1,
        authorId=1,
        groupId=1,
        images=[],
        group=SimpleNamespace(members=[member]),
    )
    mock_db.post.find_unique.return_value = mock_post

    await post_service.delete_post(user_id=2, post_id=1)

    mock_db.post.delete.assert_called_once()


@pytest.mark.asyncio
async def test_delete_post_not_author_or_owner(post_service, mock_db):
    """Test non-author/owner cannot delete"""
    member = SimpleNamespace(userId=3, role="MEMBER")
    mock_post = SimpleNamespace(
        authorId=1,
        groupId=1,
        images=[],
        group=SimpleNamespace(members=[member]),
    )
    mock_db.post.find_unique.return_value = mock_post

    with pytest.raises(ValueError, match="can only delete your own"):
        await post_service.delete_post(user_id=2, post_id=1)


@pytest.mark.asyncio
async def test_delete_post_not_found(post_service, mock_db):
    """Test delete non-existent post"""
    mock_db.post.find_unique.return_value = None

    with pytest.raises(ValueError, match="Post not found"):
        await post_service.delete_post(user_id=1, post_id=999)


# ============ toggle_like ============

@pytest.mark.asyncio
async def test_toggle_like_create(post_service, mock_db):
    """Test creating like when none exists"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = MagicMock()
    mock_db.postlike.find_unique.return_value = None
    mock_db.postlike.create.return_value = SimpleNamespace(userId=1, postId=1)

    result = await post_service.toggle_like(user_id=1, post_id=1)

    assert result["liked"] is True
    mock_db.postlike.create.assert_called_once()


@pytest.mark.asyncio
async def test_toggle_like_delete(post_service, mock_db):
    """Test deleting like when already exists"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = MagicMock()
    mock_db.postlike.find_unique.return_value = SimpleNamespace(userId=1, postId=1)

    result = await post_service.toggle_like(user_id=1, post_id=1)

    assert result["liked"] is False
    mock_db.postlike.delete.assert_called_once()


@pytest.mark.asyncio
async def test_toggle_like_post_not_found(post_service, mock_db):
    """Test toggle like on non-existent post"""
    mock_db.post.find_unique.return_value = None

    with pytest.raises(ValueError, match="Post not found"):
        await post_service.toggle_like(user_id=1, post_id=999)


@pytest.mark.asyncio
async def test_toggle_like_user_not_member(post_service, mock_db):
    """Test toggle like when user not member of group"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = None

    with pytest.raises(ValueError, match="not a member"):
        await post_service.toggle_like(user_id=1, post_id=1)


# ============ rate_post ============

@pytest.mark.asyncio
async def test_rate_post_success(post_service, mock_db):
    """Test rating post successfully"""
    mock_db.post.find_unique.return_value = SimpleNamespace(
        id=1,
        authorId=2,
        groupId=1,
        images=[SimpleNamespace(url="img.jpg")],
    )
    mock_db.groupmember.find_unique.return_value = MagicMock()
    mock_db.ratingcategory.find_unique.return_value = SimpleNamespace(id=1, name="Creativity")
    mock_db.postrating.upsert.return_value = SimpleNamespace(score=8)

    rating_input = SimpleNamespace(category="Creativity", score=8)
    result = await post_service.rate_post(user_id=1, post_id=1, ratings=[rating_input])

    assert len(result) == 1
    mock_db.postrating.upsert.assert_called_once()


@pytest.mark.asyncio
async def test_rate_post_user_is_author(post_service, mock_db):
    """Test user cannot rate own post"""
    mock_db.post.find_unique.return_value = SimpleNamespace(
        id=1,
        authorId=1,
        groupId=1,
        images=[SimpleNamespace(url="img.jpg")],
    )
    mock_db.groupmember.find_unique.return_value = MagicMock()

    with pytest.raises(ValueError, match="cannot rate your own"):
        await post_service.rate_post(user_id=1, post_id=1, ratings=[])


@pytest.mark.asyncio
async def test_rate_post_no_images(post_service, mock_db):
    """Test cannot rate post without images"""
    mock_db.post.find_unique.return_value = SimpleNamespace(
        id=1,
        authorId=2,
        groupId=1,
        images=[],
    )
    mock_db.groupmember.find_unique.return_value = MagicMock()

    with pytest.raises(ValueError, match="can only rate posts that have images"):
        await post_service.rate_post(user_id=1, post_id=1, ratings=[])


@pytest.mark.asyncio
async def test_rate_post_invalid_category(post_service, mock_db):
    """Test rating with non-existent category"""
    mock_db.post.find_unique.return_value = SimpleNamespace(
        id=1,
        authorId=2,
        groupId=1,
        images=[SimpleNamespace(url="img.jpg")],
    )
    mock_db.groupmember.find_unique.return_value = MagicMock()
    mock_db.ratingcategory.find_unique.return_value = None

    rating_input = SimpleNamespace(category="InvalidCat", score=5)
    with pytest.raises(ValueError, match="not found"):
        await post_service.rate_post(user_id=1, post_id=1, ratings=[rating_input])


# ============ get_comments ============

@pytest.mark.asyncio
async def test_get_comments_success(post_service, mock_db):
    """Test getting comments for a post"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = MagicMock()
    
    comment = SimpleNamespace(
        id=1,
        content="Great post!",
        postId=1,
        user=SimpleNamespace(id=2, username="user2"),
    )
    mock_db.postcomment.find_many.return_value = [comment]

    result = await post_service.get_comments(user_id=1, post_id=1)

    assert len(result) == 1
    assert result[0].content == "Great post!"


@pytest.mark.asyncio
async def test_get_comments_post_not_found(post_service, mock_db):
    """Test getting comments on non-existent post"""
    mock_db.post.find_unique.return_value = None

    with pytest.raises(ValueError, match="Post not found"):
        await post_service.get_comments(user_id=1, post_id=999)


@pytest.mark.asyncio
async def test_get_comments_user_not_member(post_service, mock_db):
    """Test user not member cannot get comments"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = None

    with pytest.raises(ValueError, match="not a member"):
        await post_service.get_comments(user_id=1, post_id=1)


# ============ create_comment ============

@pytest.mark.asyncio
async def test_create_comment_success_trims_content(post_service, mock_db):
    """Test creating a comment trims content and stores it"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = MagicMock()
    mock_db.postcomment.create.return_value = SimpleNamespace(
        id=10,
        content="Great post!",
        userId=1,
        postId=1,
        user=SimpleNamespace(id=1, username="alice"),
    )

    result = await post_service.create_comment(
        user_id=1,
        post_id=1,
        content="  Great post!  ",
    )

    assert result.id == 10
    mock_db.postcomment.create.assert_called_once_with(
        data={"content": "Great post!", "userId": 1, "postId": 1},
        include={"user": True},
    )


@pytest.mark.asyncio
async def test_create_comment_post_not_found(post_service, mock_db):
    """Test creating comment on non-existent post"""
    mock_db.post.find_unique.return_value = None

    with pytest.raises(ValueError, match="Post not found"):
        await post_service.create_comment(user_id=1, post_id=999, content="Nice")


@pytest.mark.asyncio
async def test_create_comment_user_not_member(post_service, mock_db):
    """Test non-member cannot create comments"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = None

    with pytest.raises(ValueError, match="not a member"):
        await post_service.create_comment(user_id=1, post_id=1, content="Nice")


@pytest.mark.asyncio
async def test_create_comment_empty_after_trim(post_service, mock_db):
    """Test empty comments are rejected after whitespace trimming"""
    mock_db.post.find_unique.return_value = SimpleNamespace(id=1, groupId=1)
    mock_db.groupmember.find_unique.return_value = MagicMock()

    with pytest.raises(ValueError, match="Comment cannot be empty"):
        await post_service.create_comment(user_id=1, post_id=1, content="   ")

    mock_db.postcomment.create.assert_not_called()


# ============ Utility Functions ============

def test_aggregate_ratings_single_category():
    """Test aggregating ratings for single category"""
    rating1 = SimpleNamespace(category=SimpleNamespace(name="Creativity"), score=8)
    rating2 = SimpleNamespace(category=SimpleNamespace(name="Creativity"), score=9)

    result = _aggregate_ratings([rating1, rating2])

    assert len(result) == 1
    assert result[0]["category"] == "Creativity"
    assert result[0]["average"] == 8.5
    assert result[0]["totalVotes"] == 2


def test_aggregate_ratings_multiple_categories():
    """Test aggregating ratings for multiple categories"""
    ratings = [
        SimpleNamespace(category=SimpleNamespace(name="Creativity"), score=8),
        SimpleNamespace(category=SimpleNamespace(name="Technique"), score=7),
        SimpleNamespace(category=SimpleNamespace(name="Creativity"), score=9),
    ]

    result = _aggregate_ratings(ratings)

    assert len(result) == 2
    categories = {r["category"]: r for r in result}
    assert categories["Creativity"]["average"] == 8.5
    assert categories["Technique"]["average"] == 7.0


def test_aggregate_ratings_empty():
    """Test aggregating empty ratings list"""
    result = _aggregate_ratings([])
    assert result == []
