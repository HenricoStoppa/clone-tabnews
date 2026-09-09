import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody).toEqual({
        updated_at: parsedUpdatedAt,
        dependencies: {
          database: {
            max_connections: responseBody.dependencies.database.max_connections,
            opened_connections:
              responseBody.dependencies.database.opened_connections,
          },
        },
      });
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    test("Retrieving current system status", async () => {
      const user = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(user);
      await orchestrator.addFeaturesToUser(activatedUser, ["read:status:all"]);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody).toEqual({
        updated_at: parsedUpdatedAt,
        dependencies: {
          database: {
            version: responseBody.dependencies.database.version,
            max_connections: responseBody.dependencies.database.max_connections,
            opened_connections:
              responseBody.dependencies.database.opened_connections,
          },
        },
      });

      expect(responseBody.dependencies.database.version).toEqual("16.0");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
