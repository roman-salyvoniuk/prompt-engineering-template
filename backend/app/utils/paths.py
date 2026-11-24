import os
from pathlib import Path


def get_backend_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def get_data_dir() -> Path:
    env_dir = os.environ.get("GAMELIBRARY_DATA_DIR", "").strip()
    data_dir = Path(env_dir).resolve() if env_dir else (get_backend_root() / "data")
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir
