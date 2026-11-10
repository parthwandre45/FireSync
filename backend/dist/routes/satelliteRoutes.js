"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const satelliteController_1 = require("../controllers/satelliteController");
const router = (0, express_1.Router)();
router.get('/', satelliteController_1.SatelliteController.getSatellites);
router.get('/imagery', satelliteController_1.SatelliteController.getImageryLayers);
router.get('/:code', satelliteController_1.SatelliteController.getSatelliteByCode);
exports.default = router;
