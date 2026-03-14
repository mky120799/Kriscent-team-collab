export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error && error.details && error.details[0]) {
        return res.status(400).json({
            message: error.details[0].message,
        });
    }
    next();
};
//# sourceMappingURL=validate.middleware.js.map