import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  orchestrator.createDummyMigration();
});

afterAll(() => {
  orchestrator.deleteDummyMigration();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Trying to run pending migrations", async () => {
      const firstResponse = await fetch(
        `${webserver.origin}/api/v1/migrations`,
        {
          method: "POST",
        },
      );
      expect(firstResponse.status).toBe(403);

      const firstResponseBody = await firstResponse.json();

      expect(firstResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa função",
        action: 'Verifique se o seu usuário possui a feature "run:migrations"',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Trying to run pending migrations", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      const sessionObject = await orchestrator.createSession(user);

      const firstResponse = await fetch(
        `${webserver.origin}/api/v1/migrations`,
        {
          method: "POST",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );
      expect(firstResponse.status).toBe(403);

      const firstResponseBody = await firstResponse.json();

      expect(firstResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa função",
        action: 'Verifique se o seu usuário possui a feature "run:migrations"',
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    describe("Running pending migrations", () => {
      let user;
      let sessionObject;

      test("For the first time", async () => {
        user = await orchestrator.createUser({});
        await orchestrator.activateUser(user);
        await orchestrator.addFeaturesToUser(user, ["run:migrations"]);
        sessionObject = await orchestrator.createSession(user);

        const firstResponse = await fetch(
          `${webserver.origin}/api/v1/migrations`,
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${sessionObject.token}`,
            },
          },
        );
        expect(firstResponse.status).toBe(201);

        const firstResponseBody = await firstResponse.json();
        expect(Array.isArray(firstResponseBody)).toBe(true);
        expect(firstResponseBody.length).toBeGreaterThan(0);
      });

      test("For the second time", async () => {
        const SecondResponse = await fetch(
          `${webserver.origin}/api/v1/migrations`,
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${sessionObject.token}`,
            },
          },
        );
        expect(SecondResponse.status).toBe(200);

        const SecondResponseBody = await SecondResponse.json();
        expect(Array.isArray(SecondResponseBody)).toBe(true);
        expect(SecondResponseBody.length).toEqual(0);
      });
    });
  });
});
