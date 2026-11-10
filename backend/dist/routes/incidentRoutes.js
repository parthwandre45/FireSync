"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incidentController_1 = require("../controllers/incidentController");
const router = (0, express_1.Router)();
router.get('/', incidentController_1.IncidentController.getIncidents);
router.get('/:id', incidentController_1.IncidentController.getIncidentById);
router.get('/:id/observations', incidentController_1.IncidentController.getIncidentObservations);
exports.default = router;
