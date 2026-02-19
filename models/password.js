import bcriptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumbersOfRounds();
  const passwordPepper = getPasswordPepper();

  return await bcriptjs.hash(password + passwordPepper, rounds);
}

function getNumbersOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

function getPasswordPepper() {
  return process.env.PASSWORD_PEPPER;
}

async function compare(providedPassword, storedPassword) {
  const passwordPepper = getPasswordPepper();
  return await bcriptjs.compare(
    providedPassword + passwordPepper,
    storedPassword,
  );
}

const password = {
  hash,
  compare,
};

export default password;
