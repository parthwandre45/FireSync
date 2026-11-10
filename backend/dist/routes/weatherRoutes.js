"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weatherController_1 = require("../controllers/weatherController");
const router = (0, express_1.Router)();
router.get('/nearby', weatherController_1.WeatherController.getNearby);
exports.default = router;
