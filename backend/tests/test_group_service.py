import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from features.group.service import GroupService


@pytest.fixture
def mock_db():
    return SimpleNamespace(
        user=SimpleNamespace(
            find_unique=AsyncMock(),
            create=AsyncMock(),
        ),
        group=SimpleNamespace(
            find_unique=AsyncMock(),
            create=AsyncMock(),
            find_many=AsyncMock(),
            delete=AsyncMock(),
        ),
        groupmember=SimpleNamespace(
            find_unique=AsyncMock(),
            create=AsyncMock(),
            find_many=AsyncMock(),
            delete=AsyncMock(),
        ),
        invite=SimpleNamespace(
            find_unique=AsyncMock(),
            create=AsyncMock(),
            find_many=AsyncMock(),
            upsert=AsyncMock(),
            delete=AsyncMock(),
        ),
    )


@pytest.fixture
def group_service(mock_db):
    return GroupService(mock_db)


# ============================================================================
# TEST: create_group
# ============================================================================

@pytest.mark.asyncio
async def test_create_group_success(group_service, mock_db):
    """Deve criar um novo grupo com usuário como owner"""
    mock_db.user.find_unique.return_value = SimpleNamespace(id=1, username="alice")
    mock_db.group.create.return_value = SimpleNamespace(
        id=100,
        name="Estúdio de Arte",
        description="Um coletivo criativo",
        visibility="PUBLIC",
    )

    result = await group_service.create_group(1, "Estúdio de Arte", "Um coletivo criativo", "public")

    assert result.id == 100
    assert result.name == "Estúdio de Arte"
    mock_db.user.find_unique.assert_awaited_once_with(where={"id": 1})
    mock_db.group.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_group_user_not_found(group_service, mock_db):
    """Deve falhar se usuário não existe"""
    mock_db.user.find_unique.return_value = None

    with pytest.raises(ValueError, match="User not found"):
        await group_service.create_group(999, "Grupo", "Descrição", "public")


# ============================================================================
# TEST: send_invite
# ============================================================================

@pytest.mark.asyncio
async def test_send_invite_success(group_service, mock_db):
    """Deve enviar convite para usuário ingressar no grupo"""
    mock_db.groupmember.find_unique.side_effect = [
        SimpleNamespace(userId=1, groupId=1, role="OWNER"),  # sender é membro
        None,  # receiver não é membro ainda
    ]
    mock_db.user.find_unique.return_value = SimpleNamespace(id=2, username="bob")
    mock_db.invite.upsert.return_value = SimpleNamespace(
        id=50,
        senderId=1,
        receiverId=2,
        groupId=1,
    )

    result = await group_service.send_invite(1, 1, 2)

    assert result.id == 50
    assert result.receiverId == 2
    mock_db.invite.upsert.assert_awaited_once()


@pytest.mark.asyncio
async def test_send_invite_sender_not_member(group_service, mock_db):
    """Deve falhar se sender não é membro do grupo"""
    mock_db.groupmember.find_unique.return_value = None

    with pytest.raises(ValueError, match="not a member of this group"):
        await group_service.send_invite(1, 1, 2)


@pytest.mark.asyncio
async def test_send_invite_receiver_not_found(group_service, mock_db):
    """Deve falhar se receiver não existe"""
    mock_db.groupmember.find_unique.return_value = SimpleNamespace(userId=1, groupId=1, role="OWNER")
    mock_db.user.find_unique.return_value = None

    with pytest.raises(ValueError, match="User not found"):
        await group_service.send_invite(1, 1, 999)


@pytest.mark.asyncio
async def test_send_invite_receiver_already_member(group_service, mock_db):
    """Deve falhar se receiver já é membro"""
    mock_db.groupmember.find_unique.side_effect = [
        SimpleNamespace(userId=1, groupId=1, role="OWNER"),  # sender é membro
        SimpleNamespace(id=2, username="bob"),  # receiver já é membro
    ]
    mock_db.user.find_unique.return_value = SimpleNamespace(id=2, username="bob")

    with pytest.raises(ValueError, match="already a member"):
        await group_service.send_invite(1, 1, 2)


# ============================================================================
# TEST: list_invites
# ============================================================================

@pytest.mark.asyncio
async def test_list_invites_success(group_service, mock_db):
    """Deve listar convites enviados e recebidos pelo usuário"""
    mock_db.invite.find_many.return_value = [
        SimpleNamespace(id=1, senderId=1, receiverId=2, groupId=1),
        SimpleNamespace(id=2, senderId=3, receiverId=1, groupId=2),
    ]

    result = await group_service.list_invites(1)

    assert len(result) == 2
    assert result[0].id == 1
    assert result[1].id == 2
    mock_db.invite.find_many.assert_awaited_once()


@pytest.mark.asyncio
async def test_list_invites_empty(group_service, mock_db):
    """Deve retornar lista vazia se sem convites"""
    mock_db.invite.find_many.return_value = []

    result = await group_service.list_invites(1)

    assert result == []


# ============================================================================
# TEST: accept_invite
# ============================================================================

@pytest.mark.asyncio
async def test_accept_invite_success(group_service, mock_db):
    """Deve aceitar convite e criar membership"""
    mock_db.invite.find_unique.return_value = SimpleNamespace(
        id=50, receiverId=2, groupId=1, senderId=1
    )
    mock_db.groupmember.create.return_value = SimpleNamespace(
        userId=2, groupId=1, role="MEMBER"
    )

    result = await group_service.accept_invite(2, 50)

    assert result.role == "MEMBER"
    mock_db.groupmember.create.assert_awaited_once()
    mock_db.invite.delete.assert_awaited_once_with(where={"id": 50})


@pytest.mark.asyncio
async def test_accept_invite_not_found(group_service, mock_db):
    """Deve falhar se convite não existe"""
    mock_db.invite.find_unique.return_value = None

    with pytest.raises(ValueError, match="Invite not found"):
        await group_service.accept_invite(2, 999)


@pytest.mark.asyncio
async def test_accept_invite_not_receiver(group_service, mock_db):
    """Deve falhar se usuário não é receptor do convite"""
    mock_db.invite.find_unique.return_value = SimpleNamespace(
        id=50, receiverId=2, groupId=1
    )

    with pytest.raises(ValueError, match="not for you"):
        await group_service.accept_invite(3, 50)


# ============================================================================
# TEST: list_groups
# ============================================================================

@pytest.mark.asyncio
async def test_list_groups_success(group_service, mock_db):
    """Deve listar grupos do usuário"""
    mock_db.groupmember.find_many.return_value = [
        SimpleNamespace(
            groupId=1,
            role="OWNER",
            group=SimpleNamespace(
                id=1,
                name="Estúdio Principal",
                description="Meu estúdio",
                visibility="PRIVATE",
                members=[SimpleNamespace(userId=1)],
                posts=[SimpleNamespace(
                    content="Post 1",
                    author=SimpleNamespace(username="alice"),
                    createdAt="2026-05-19",
                )],
            ),
        ),
    ]

    result = await group_service.list_groups(1)

    assert len(result) == 1
    assert result[0]["name"] == "Estúdio Principal"
    assert result[0]["role"] == "OWNER"
    assert result[0]["visibility"] == "private"


# ============================================================================
# TEST: list_public_groups
# ============================================================================

@pytest.mark.asyncio
async def test_list_public_groups_excludes_user_groups(group_service, mock_db):
    """Deve listar apenas grupos publicos que o usuario ainda nao participa"""
    mock_db.groupmember.find_many.return_value = [
        SimpleNamespace(userId=1, groupId=1, role="MEMBER"),
    ]
    mock_db.group.find_many.return_value = [
        SimpleNamespace(
            id=1,
            name="Grupo ja participo",
            description="Nao deve aparecer",
            visibility="PUBLIC",
            createdAt="2026-05-19",
            members=[
                SimpleNamespace(userId=9, role="OWNER"),
                SimpleNamespace(userId=1, role="MEMBER"),
            ],
        ),
        SimpleNamespace(
            id=2,
            name="Coletivo Aberto",
            description=None,
            visibility="PUBLIC",
            createdAt="2026-05-19",
            members=[
                SimpleNamespace(userId=3, role="OWNER"),
                SimpleNamespace(userId=4, role="MEMBER"),
            ],
        ),
    ]

    result = await group_service.list_public_groups(1)

    assert len(result) == 1
    assert result[0]["id"] == 2
    assert result[0]["name"] == "Coletivo Aberto"
    assert result[0]["description"] == ""
    assert result[0]["member_count"] == 2
    assert result[0]["visibility"] == "public"
    assert result[0]["creator_id"] == 3


@pytest.mark.asyncio
async def test_list_public_groups_without_owner_uses_zero_creator_id(group_service, mock_db):
    """Deve retornar creator_id zero quando grupo publico nao tem owner carregado"""
    mock_db.groupmember.find_many.return_value = []
    mock_db.group.find_many.return_value = [
        SimpleNamespace(
            id=3,
            name="Grupo Sem Owner",
            description="Aberto",
            visibility="PUBLIC",
            createdAt="2026-05-19",
            members=[SimpleNamespace(userId=5, role="MEMBER")],
        ),
    ]

    result = await group_service.list_public_groups(1)

    assert result[0]["creator_id"] == 0
    assert result[0]["cover_url"] is None


# ============================================================================
# TEST: remove_member
# ============================================================================

@pytest.mark.asyncio
async def test_remove_member_self(group_service, mock_db):
    """Deve permitir usuário se remover do grupo"""
    mock_db.groupmember.find_unique.side_effect = [
        SimpleNamespace(userId=1, groupId=1, role="MEMBER"),  # requester
        SimpleNamespace(userId=1, groupId=1, role="MEMBER"),  # target
    ]

    await group_service.remove_member(1, 1, 1)

    mock_db.groupmember.delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_remove_member_owner_can_remove(group_service, mock_db):
    """Deve permitir owner remover outro membro"""
    mock_db.groupmember.find_unique.side_effect = [
        SimpleNamespace(userId=1, groupId=1, role="OWNER"),  # requester é owner
        SimpleNamespace(userId=2, groupId=1, role="MEMBER"),  # target
    ]

    await group_service.remove_member(1, 1, 2)

    mock_db.groupmember.delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_remove_member_not_owner(group_service, mock_db):
    """Deve falhar se membro comum tenta remover outro"""
    mock_db.groupmember.find_unique.side_effect = [
        SimpleNamespace(userId=1, groupId=1, role="MEMBER"),  # requester
    ]

    with pytest.raises(ValueError, match="Only the owner"):
        await group_service.remove_member(1, 1, 2)


@pytest.mark.asyncio
async def test_remove_member_cannot_remove_owner(group_service, mock_db):
    """Deve falhar ao tentar remover owner do grupo"""
    mock_db.groupmember.find_unique.side_effect = [
        SimpleNamespace(userId=1, groupId=1, role="OWNER"),  # requester
        SimpleNamespace(userId=2, groupId=1, role="OWNER"),  # target é owner
    ]

    with pytest.raises(ValueError, match="Cannot remove the group owner"):
        await group_service.remove_member(1, 1, 2)


# ============================================================================
# TEST: delete_group
# ============================================================================

@pytest.mark.asyncio
async def test_delete_group_owner_can_delete(group_service, mock_db):
    """Deve permitir owner deletar o grupo"""
    mock_db.groupmember.find_unique.return_value = SimpleNamespace(
        userId=1, groupId=1, role="OWNER"
    )

    await group_service.delete_group(1, 1)

    mock_db.group.delete.assert_awaited_once_with(where={"id": 1})


@pytest.mark.asyncio
async def test_delete_group_not_owner(group_service, mock_db):
    """Deve falhar se membro comum tenta deletar"""
    mock_db.groupmember.find_unique.return_value = SimpleNamespace(
        userId=1, groupId=1, role="MEMBER"
    )

    with pytest.raises(ValueError, match="Only the owner"):
        await group_service.delete_group(1, 1)


@pytest.mark.asyncio
async def test_delete_group_not_member(group_service, mock_db):
    """Deve falhar se usuário não é membro"""
    mock_db.groupmember.find_unique.return_value = None

    with pytest.raises(ValueError, match="not a member"):
        await group_service.delete_group(1, 1)
