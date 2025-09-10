import express from 'express'; // ✅ use import instead of require
const router = express.Router();
import statisticsController from '../controllers/statisticsController.js';

router.post('/login',statisticsController.login);

    
export default router; // ✅ this must exist