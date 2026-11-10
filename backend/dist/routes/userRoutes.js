"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Protect all user routes
router.use(auth_1.authenticate, auth_1.requireAuth);
const savedLocationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    radiusKm: zod_1.z.number().min(1).max(1000).optional()
});
const alertRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    radiusKm: zod_1.z.number().min(1).max(1000).optional(),
    alertType: zod_1.z.string().optional(),
    threshold: zod_1.z.number().optional(),
    enabled: zod_1.z.boolean().optional()
});
// Saved Locations
router.get('/saved-locations', userController_1.UserController.getSavedLocations);
router.post('/saved-locations', (0, validation_1.validateRequest)({ body: savedLocationSchema }), userController_1.UserController.createSavedLocation);
router.delete('/saved-locations/:id', userController_1.UserController.deleteSavedLocation);
// Alert Rules
router.get('/alerts', userController_1.UserController.getAlertRules);
router.post('/alerts', (0, validation_1.validateRequest)({ body: alertRuleSchema }), userController_1.UserController.createAlertRule);
router.put('/alerts/:id', userController_1.UserController.updateAlertRule);
router.delete('/alerts/:id', userController_1.UserController.deleteAlertRule);
exports.default = router;
