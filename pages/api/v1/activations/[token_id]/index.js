import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;
  const validActivationObject =
    await activation.findOneValidByToken(activationTokenId);
  const usedActivatedObject =
    await activation.markTokenAsUsed(activationTokenId);

  await activation.activateUserById(validActivationObject.user_id);

  return response.status(200).json(usedActivatedObject);
}
