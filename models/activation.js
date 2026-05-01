import database from "infra/database.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";
import user from "./user.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
        ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Clonetabs <contato@clonetabs.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no Clonetabs!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Clonetabs!

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe Clonetabs.
`,
  });
}

async function findOneValidByToken(token) {
  const activationTokenFound = await runSelectQuery(token);

  return activationTokenFound;

  async function runSelectQuery(token) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O token não foi encontrado ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(tokenId) {
  const results = await database.query({
    text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
    values: [tokenId],
  });

  return results.rows[0];
}

async function activateUserById(userId) {
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);

  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidByToken,
  markTokenAsUsed,
  activateUserById,
};

export default activation;
