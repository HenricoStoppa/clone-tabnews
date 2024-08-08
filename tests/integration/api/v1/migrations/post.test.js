import database from "infra/database";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("drop schema public cascade; create schema public;");
});

test("POST to /api/v1/migrations should return 200", async () => {
  const firstResponse = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(firstResponse.status).toBe(201);

  const firstResponseBody = await firstResponse.json();
  expect(Array.isArray(firstResponseBody)).toBe(true);
  expect(firstResponseBody.length).toBeGreaterThan(0);

  const SecondResponse = await fetch(
    "http://localhost:3000/api/v1/migrations",
    {
      method: "POST",
    },
  );
  expect(SecondResponse.status).toBe(200);

  const SecondResponseBody = await SecondResponse.json();
  expect(Array.isArray(SecondResponseBody)).toBe(true);
  expect(SecondResponseBody.length).toEqual(0);
});
