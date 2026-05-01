import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;
  const validActivationObject =
    await activation.findOneValidByToken(activationTokenId);

  await activation.activateUserById(validActivationObject.user_id);

  const usedActivatedObject =
    await activation.markTokenAsUsed(activationTokenId);

  return response.status(200).json(usedActivatedObject);
}
