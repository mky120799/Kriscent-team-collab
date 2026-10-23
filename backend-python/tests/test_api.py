from unittest.mock import AsyncMock, call

import httpx

from tests.conftest import auth, register


async def test_health(client: httpx.AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.text == "OK"
    assert response.headers["x-content-type-options"] == "nosniff"


async def test_requests_without_valid_token_are_rejected(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/projects")
    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized: No token provided"}

    response = await client.get("/api/projects", headers={"Authorization": "Bearer nope"})
    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized: Invalid token"}

    response = await client.get("/api/projects", headers=auth("ghost"))
    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized: User not found in database"}


async def test_cors_allows_frontend_origin(client: httpx.AsyncClient) -> None:
    response = await client.options(
        "/api/projects",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"

    response = await client.options(
        "/api/projects",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in response.headers


async def test_first_user_becomes_admin_with_default_team(client: httpx.AsyncClient) -> None:
    admin = await register(client, "alice")
    assert admin["role"] == "ADMIN"
    assert admin["teamId"]

    member = await register(client, "bob")
    assert member["role"] == "MEMBER"
    assert member["teamId"] is None

    again = await client.post(
        "/api/users", json={"firebaseUid": "bob", "name": "Bob", "email": "bob@example.com"}
    )
    assert again.status_code == 200
    assert again.json()["_id"] == member["_id"]


async def test_login_starts_session_and_me_returns_user(client: httpx.AsyncClient) -> None:
    await register(client, "alice")

    response = await client.post("/api/auth/login", json={"idToken": "token-alice"})
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["email"] == "alice@example.com"
    assert user["createdAt"].endswith("Z")
    assert "kriscent.sid" in response.cookies

    response = await client.post("/api/auth/login", json={})
    assert response.status_code == 400
    assert response.json() == {"message": "No token provided"}

    response = await client.get("/api/auth/me", headers=auth("alice"))
    assert response.json()["user"]["_id"] == user["_id"]


async def test_project_lifecycle(client: httpx.AsyncClient, emit: AsyncMock) -> None:
    admin = await register(client, "alice")
    await register(client, "bob")
    team_id = admin["teamId"]

    # Validation errors use Joi-style messages
    response = await client.post(
        "/api/projects", headers=auth("alice"), json={"name": "ab", "teamId": team_id}
    )
    assert response.status_code == 400
    assert response.json() == {"message": '"name" length must be at least 3 characters long'}

    response = await client.post(
        "/api/projects", headers=auth("bob"), json={"name": "Website", "teamId": team_id}
    )
    assert response.status_code == 403
    assert response.json() == {"message": "Forbidden"}

    # The frontend sends an empty description when the field is left blank
    response = await client.post(
        "/api/projects",
        headers=auth("alice"),
        json={"name": "  Website  ", "description": "", "teamId": team_id},
    )
    assert response.status_code == 201
    project = response.json()
    assert project["name"] == "Website"
    assert project["teamId"] == team_id
    emit.assert_awaited_with("project-created", project, room=team_id)

    response = await client.get("/api/projects", headers=auth("alice"))
    assert [p["_id"] for p in response.json()] == [project["_id"]]

    # Bob is not in a team yet, so he sees nothing
    response = await client.get("/api/projects", headers=auth("bob"))
    assert response.json() == []

    response = await client.put(
        f"/api/projects/{project['_id']}", headers=auth("alice"), json={"name": "Web App"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Web App"

    response = await client.put("/api/projects/not-an-id", headers=auth("alice"), json={})
    assert response.status_code == 404

    response = await client.delete(f"/api/projects/{project['_id']}", headers=auth("alice"))
    assert response.json() == {"message": "Project deleted successfully"}
    emit.assert_awaited_with("project-deleted", {"projectId": project["_id"]}, room=team_id)

    response = await client.get("/api/activity", headers=auth("alice"))
    logs = response.json()
    assert [log["action"] for log in logs] == ["PROJECT_DELETED", "PROJECT_UPDATED", "PROJECT_CREATED"]
    assert logs[0]["performedBy"] == {"_id": admin["_id"], "name": "Alice", "email": "alice@example.com"}


async def test_team_membership_and_roles(client: httpx.AsyncClient) -> None:
    admin = await register(client, "alice")
    bob = await register(client, "bob")
    team_id = admin["teamId"]

    response = await client.post(
        f"/api/teams/{team_id}/members",
        headers=auth("alice"),
        json={"userId": bob["_id"], "role": "MANAGER"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "MANAGER"

    response = await client.get(f"/api/teams/{team_id}/members", headers=auth("bob"))
    members = response.json()
    assert {m["email"] for m in members} == {"alice@example.com", "bob@example.com"}
    assert set(members[0]) == {"_id", "name", "email", "role"}

    response = await client.get("/api/teams", headers=auth("bob"))
    assert [t["_id"] for t in response.json()] == [team_id]

    response = await client.post("/api/teams", headers=auth("bob"), json={"name": "Side"})
    assert response.status_code == 403

    response = await client.post("/api/teams", headers=auth("alice"), json={"name": "Side"})
    assert response.status_code == 201

    response = await client.patch(
        f"/api/users/{bob['_id']}/role", headers=auth("alice"), json={"role": "BOSS"}
    )
    assert response.status_code == 400
    assert response.json() == {"message": "Invalid role"}

    response = await client.patch(
        f"/api/users/{bob['_id']}/role", headers=auth("bob"), json={"role": "ADMIN"}
    )
    assert response.status_code == 403

    response = await client.patch(
        "/api/users/65a1b2c3d4e5f6a7b8c9d0e1/role", headers=auth("alice"), json={"role": "MEMBER"}
    )
    assert response.status_code == 404

    response = await client.patch("/api/users/profile", headers=auth("bob"), json={"name": "Robert"})
    assert response.json()["user"]["name"] == "Robert"


async def test_user_search_and_project_filter(client: httpx.AsyncClient) -> None:
    admin = await register(client, "alice")
    await register(client, "bob")
    await register(client, "carol")
    team_id = admin["teamId"]

    response = await client.get("/api/users", headers=auth("alice"), params={"search": "CAR"})
    assert [u["name"] for u in response.json()] == ["Carol"]

    # Regex characters are matched literally
    response = await client.get("/api/users", headers=auth("alice"), params={"search": ".*"})
    assert response.json() == []

    project = (
        await client.post(
            "/api/projects", headers=auth("alice"), json={"name": "Website", "teamId": team_id}
        )
    ).json()

    response = await client.get(
        "/api/users", headers=auth("alice"), params={"projectId": project["_id"]}
    )
    assert [u["name"] for u in response.json()] == ["Alice"]

    # Search is combined with the project filter rather than replacing it
    response = await client.get(
        "/api/users",
        headers=auth("alice"),
        params={"projectId": project["_id"], "search": "bob"},
    )
    assert response.json() == []

    response = await client.get(
        "/api/users", headers=auth("alice"), params={"projectId": "65a1b2c3d4e5f6a7b8c9d0e1"}
    )
    assert response.status_code == 404


async def test_task_lifecycle(client: httpx.AsyncClient, emit: AsyncMock) -> None:
    admin = await register(client, "alice")
    bob = await register(client, "bob")
    team_id = admin["teamId"]
    await client.post(
        f"/api/teams/{team_id}/members", headers=auth("alice"), json={"userId": bob["_id"]}
    )
    project = (
        await client.post(
            "/api/projects", headers=auth("alice"), json={"name": "Website", "teamId": team_id}
        )
    ).json()

    response = await client.post(
        "/api/tasks",
        headers=auth("alice"),
        json={"title": "Build login", "projectId": project["_id"], "assignedTo": bob["_id"]},
    )
    assert response.status_code == 201
    task = response.json()
    assert task["status"] == "todo"
    assert task["teamId"] == team_id
    assert task["assignedTo"] == bob["_id"]
    emit.assert_awaited_with("task-created", task, room=team_id)

    response = await client.post(
        "/api/tasks", headers=auth("bob"), json={"title": "Nope", "projectId": project["_id"]}
    )
    assert response.status_code == 403

    response = await client.get("/api/tasks", headers=auth("bob"), params={"projectId": project["_id"]})
    [listed] = response.json()
    assert listed["assignedTo"] == {
        "_id": bob["_id"],
        "name": "Bob",
        "email": "bob@example.com",
        "role": "MEMBER",
    }

    # Members can move tasks between columns
    response = await client.put(
        f"/api/tasks/{task['_id']}", headers=auth("bob"), json={"status": "in-progress"}
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "in-progress"
    assert updated["assignedTo"]["name"] == "Bob"
    emit.assert_awaited_with("task-updated", updated, room=team_id)

    response = await client.put(
        f"/api/tasks/{task['_id']}", headers=auth("bob"), json={"status": "blocked"}
    )
    assert response.status_code == 400
    assert response.json() == {"message": '"status" must be one of [\'todo\', \'in-progress\' or \'done\']'}

    response = await client.delete(f"/api/tasks/{task['_id']}", headers=auth("alice"))
    assert response.json() == {"message": "Task deleted successfully"}
    assert emit.await_args == call("task-deleted", {"taskId": task["_id"]}, room=team_id)

    response = await client.get("/api/tasks", headers=auth("bob"))
    assert response.status_code == 400
    assert response.json() == {"message": "Invalid or missing projectId"}


async def test_chat_messages(client: httpx.AsyncClient, emit: AsyncMock) -> None:
    admin = await register(client, "alice")
    await register(client, "bob")
    team_id = admin["teamId"]

    response = await client.post(
        "/api/messages", headers=auth("alice"), json={"content": "  Hello team  ", "teamId": team_id}
    )
    assert response.status_code == 201
    message = response.json()
    assert message["content"] == "Hello team"
    assert message["senderId"] == {"_id": admin["_id"], "name": "Alice"}
    emit.assert_awaited_with("new-message", message, room=team_id)

    response = await client.post("/api/messages", headers=auth("alice"), json={"teamId": team_id})
    assert response.status_code == 400

    response = await client.get("/api/messages", headers=auth("alice"), params={"teamId": team_id})
    [history] = response.json()
    assert history["senderId"] == {"_id": admin["_id"], "name": "Alice"}

    # Bob is not in the team
    response = await client.get("/api/messages", headers=auth("bob"), params={"teamId": team_id})
    assert response.status_code == 403


async def test_assistant_uses_fallback_parser_without_gemini_key(client: httpx.AsyncClient) -> None:
    await register(client, "alice")

    response = await client.post(
        "/api/assistant/parse", headers=auth("alice"), json={"prompt": "Move task Login to done"}
    )
    assert response.json() == {"action": "update", "title": "Login", "status": "done"}

    response = await client.post("/api/assistant/parse", headers=auth("alice"), json={"prompt": 42})
    assert response.status_code == 400
    assert response.json() == {"message": "Invalid or missing prompt"}
