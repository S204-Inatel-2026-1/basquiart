from pydantic import BaseModel, field_validator, Field
import re


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("A senha deve conter ao menos uma letra maiúscula")
        if not re.search(r"[0-9]", v):
            raise ValueError("A senha deve conter ao menos um número")
        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("A senha deve conter ao menos um caractere especial (!@#$%^&*)")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class RefreshTokenBody(BaseModel):
    refresh_token: str
