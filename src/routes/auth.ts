import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';
import { guest } from '../middleware/auth.js';

const router = Router();

router.get('/login', guest, (req, res) => authController.showLoginForm(req, res));
router.post('/login', guest, (req, res) => authController.login(req, res));
router.get('/logout', (req, res) => authController.logout(req, res));

export default router;
