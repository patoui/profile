import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { dashboardController } from '../controllers/admin/DashboardController.js';
import { adminPostController } from '../controllers/admin/PostController.js';
import { adminTipController } from '../controllers/admin/TipController.js';
import { adminVideoController } from '../controllers/admin/VideoController.js';

const router = Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', (req, res) => dashboardController.index(req, res));

// Posts
router.get('/posts', (req, res) => adminPostController.index(req, res));
router.get('/post/create', (req, res) => adminPostController.create(req, res));
router.post('/post', (req, res) => adminPostController.store(req, res));
router.get('/post/:id/edit', (req, res) => adminPostController.edit(req, res));
router.post('/post/:id', (req, res) => adminPostController.update(req, res));
router.get('/post/:id/publish', (req, res) => adminPostController.togglePublish(req, res));
router.post('/post/:id/delete', (req, res) => adminPostController.destroy(req, res));

// Tips
router.get('/tips', (req, res) => adminTipController.index(req, res));
router.get('/tip/create', (req, res) => adminTipController.create(req, res));
router.post('/tip', (req, res) => adminTipController.store(req, res));
router.get('/tip/:id/edit', (req, res) => adminTipController.edit(req, res));
router.post('/tip/:id', (req, res) => adminTipController.update(req, res));
router.get('/tip/:id/publish', (req, res) => adminTipController.togglePublish(req, res));
router.post('/tip/:id/delete', (req, res) => adminTipController.destroy(req, res));

// Videos
router.get('/videos', (req, res) => adminVideoController.index(req, res));
router.get('/video/create', (req, res) => adminVideoController.create(req, res));
router.post('/video', (req, res) => adminVideoController.store(req, res));
router.get('/video/:id/edit', (req, res) => adminVideoController.edit(req, res));
router.post('/video/:id', (req, res) => adminVideoController.update(req, res));
router.get('/video/:id/publish', (req, res) => adminVideoController.togglePublish(req, res));
router.post('/video/:id/delete', (req, res) => adminVideoController.destroy(req, res));

export default router;
