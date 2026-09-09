import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";
import activation from "models/activation.js";
import webserver from "infra/webserver.js";

const fs = require("fs");
import { resolve } from "node:path";
const { execSync } = require("node:child_process");

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch(`${webserver.origin}/api/v1/status`);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject.email || faker.internet.email(),
    password: userObject.password || "validpassword",
  });
}

async function createSession(userObject) {
  return await session.create(userObject.id);
}

async function deleteAllEmail() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();

  lastEmailItem.text = emailTextBody;

  return lastEmailItem;
}

async function activateUser(user) {
  return await activation.activateUserById(user.id);
}

async function addFeaturesToUser(userObject, features) {
  const updatedUser = await user.addFeatures(userObject.id, features);

  return updatedUser;
}

function createDummyMigration() {
  execSync("npm run migrations:create -- dummy migration");
}

function deleteDummyMigration() {
  const folderPath = resolve(__dirname, "../infra/migrations");
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Erro ao ler pasta:", err);
      return;
    }
    const lastFileFound = files[files.length - 1];
    const completePath = resolve(folderPath, lastFileFound);
    if (!lastFileFound.endsWith("dummy-migration.js")) {
      console.error("Erro ao encontrar arquivo.");
      return;
    }

    fs.unlink(completePath, (err) => {
      if (err) {
        console.error("Erro ao excluir arquivo:", err);
      }
    });
  });
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmail,
  getLastEmail,
  activateUser,
  addFeaturesToUser,
  createDummyMigration,
  deleteDummyMigration,
};

export default orchestrator;
