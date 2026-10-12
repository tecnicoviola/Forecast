import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_get_cities():
    response = client.get("/api/cities")
    assert response.status_code == 200
    data = response.json()
    assert "cities" in data
    assert len(data["cities"]) > 0
    assert any(c["name"] == "New Delhi" for c in data["cities"])

def test_geocode_validation():
    response = client.get("/api/geocode?query=a")
    assert response.status_code == 422  # validation min_length=2
