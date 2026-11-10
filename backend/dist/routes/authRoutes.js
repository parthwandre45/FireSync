"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    fullName: zod_1.z.string().min(2)
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
router.post('/register', (0, validation_1.validateRequest)({ body: registerSchema }), authController_1.AuthController.register);
router.post('/login', (0, validation_1.validateRequest)({ body: loginSchema }), authController_1.AuthController.login);
router.post('/logout', authController_1.AuthController.logout);
router.get('/me', auth_1.authenticate, auth_1.requireAuth, authController_1.AuthController.me);
exports.default = router;
