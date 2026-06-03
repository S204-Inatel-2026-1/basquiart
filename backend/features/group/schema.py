from pydantic import BaseModel, field_validator
from features.shared.visibility import Visibility


class CreateGroupBody(BaseModel):
    name: str
    description: str | None = None
    visibility: str = Visibility.PRIVATE

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {Visibility.PUBLIC, Visibility.PRIVATE}:
            raise ValueError("visibility must be 'public' or 'private'")
        return normalized


class SendInviteBody(BaseModel):
    group_id: int
    receiverId: int
