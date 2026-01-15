import Joi from "joi";

export const createTaskSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  projectId: Joi.string().required(),
  assignedTo: Joi.string().optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid("todo", "in-progress", "done").optional(),
  assignedTo: Joi.string().optional(),
});
