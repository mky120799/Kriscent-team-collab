import Joi from "joi";

export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).required(),
  teamId: Joi.string().required(),
});
