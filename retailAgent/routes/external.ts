import express from "express";
import * as inventoryController from "../controllers/medicalInvnetory";
import * as activityLogController from "../controllers/activityLogs";

const routes = express.Router();

routes.post("/simulate", inventoryController.simulate)
routes.get("/activityLogs", activityLogController.fetchActivityLogs)
routes.get("/inventory", inventoryController.getItems)

export default routes;
