"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
function validateRequest(schema) {
    return async (req, res, next) => {
        try {
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
