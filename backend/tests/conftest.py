from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import database, main
from app.database import Base


@pytest.fixture

def client(monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    test_sessions = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "SessionLocal", test_sessions)
    monkeypatch.setattr(database, "SessionLocal", test_sessions)
    monkeypatch.setenv("SEED_DEMO_DATA", "false")
    Base.metadata.create_all(bind=engine)
    with TestClient(main.app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
