import Joi from "joi";

export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  teamId: Joi.string().required(),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  description: Joi.string().optional(),
});
