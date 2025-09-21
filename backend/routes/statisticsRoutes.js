import express from 'express';
const router = express.Router();
import statisticsController from '../controllers/statisticsController.js';

router.post('/login', statisticsController.login);

router.post('/login/forgot-password', statisticsController.forgotPassword);

router.post('/login/reset-password', statisticsController.resetPassword);

router.get('/dashboard', statisticsController.dashboard);

router.get("/getAllResorts", statisticsController.getResorts);

router.post("/addResort", statisticsController.addResort);

router.put("/updateResort/:id", statisticsController.updateResort);

router.delete("/deleteResort/:id", statisticsController.deleteResort);


export default router; // this must exist