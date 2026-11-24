import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import uuid

from fastapi import HTTPException, status

from app.models.user import (
    AuthResponse,
    UserInDb,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.repositories.user_repository import UserRepository

TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60
DEFAULT_DEV_SECRET = "gamelibrary-dev-hmac-secret-key-2026"


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(f"{data}{padding}".encode("ascii"))


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    @staticmethod
    def _get_secret() -> bytes:
        secret = os.environ.get("GAMELIBRARY_SECRET_KEY", "").strip() or DEFAULT_DEV_SECRET
        return secret.encode("utf-8")

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
        ).hex()

    @classmethod
    def _create_token(cls, user_id: str) -> str:
        now = int(time.time())
        payload = {"sub": user_id, "iat": now, "exp": now + TOKEN_TTL_SECONDS}
        payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        encoded_payload = _b64url_encode(payload_bytes)
        sig = hmac.new(cls._get_secret(), encoded_payload.encode("ascii"), hashlib.sha256).digest()
        return f"{encoded_payload}.{_b64url_encode(sig)}"

    @classmethod
    def _verify_token(cls, token: str) -> str | None:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        encoded_payload, encoded_sig = parts
        if not encoded_payload or not encoded_sig:
            return None

        expected_sig = hmac.new(
            cls._get_secret(), encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        try:
            provided_sig = _b64url_decode(encoded_sig)
        except Exception:
            return None

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        try:
            payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
        except Exception:
            return None

        if not isinstance(payload, dict):
            return None
        sub = payload.get("sub")
        exp = payload.get("exp")
        if not isinstance(sub, str) or not sub or not isinstance(exp, int):
            return None
        if exp < int(time.time()):
            return None
        return sub

    @staticmethod
    def _to_user_response(user: UserInDb) -> UserResponse:
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
        )

    def register(self, req: UserRegisterRequest) -> AuthResponse:
        if self._user_repo.get_by_email(req.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already in use",
            )
        if self._user_repo.get_by_username(req.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already in use",
            )

        salt = secrets.token_hex(16)
        hashed_password = self._hash_password(req.password, salt)
        user_id = str(uuid.uuid4())

        user_in_db = UserInDb(
            id=user_id,
            username=req.username.strip(),
            email=req.email.strip().lower(),
            hashed_password=hashed_password,
            salt=salt,
        )
        self._user_repo.create(user_in_db)

        token = self._create_token(user_id)
        return AuthResponse(token=token, user=self._to_user_response(user_in_db))

    def login(self, req: UserLoginRequest) -> AuthResponse:
        user = self._user_repo.get_by_email(req.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        expected_hash = self._hash_password(req.password, user.salt)
        if not secrets.compare_digest(expected_hash, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        token = self._create_token(user.id)
        return AuthResponse(token=token, user=self._to_user_response(user))

    def get_user_by_token(self, token: str) -> UserResponse | None:
        user_id = self._verify_token(token)
        if not user_id:
            return None
        user = self._user_repo.get_by_id(user_id)
        if not user:
            return None
        return self._to_user_response(user)
