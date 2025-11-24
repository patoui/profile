import { Router } from 'express';
import { homeController } from '../controllers/HomeController.js';
import { postController } from '../controllers/PostController.js';
import { tipController } from '../controllers/TipController.js';
import { videoController } from '../controllers/VideoController.js';
import { feedController } from '../controllers/FeedController.js';

const router = Router();

// Home
router.get('/', (req, res) => homeController.index(req, res));

// Posts
router.get('/blog', (req, res) => postController.index(req, res));
router.get('/post/:slug', (req, res) => postController.show(req, res));

// Tips
router.get('/tip', (req, res) => tipController.index(req, res));
router.get('/tip/:slug', (req, res) => tipController.show(req, res));

// Videos
router.get('/video', (req, res) => videoController.index(req, res));
router.get('/video/:slug', (req, res) => videoController.show(req, res));

// RSS Feeds
router.get('/feeds/posts', (req, res) => feedController.posts(req, res));
router.get('/feeds/tips', (req, res) => feedController.tips(req, res));
router.get('/feeds/videos', (req, res) => feedController.videos(req, res));
router.get('/feeds/all', (req, res) => feedController.all(req, res));

export default router;
