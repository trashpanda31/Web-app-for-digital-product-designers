import express from 'express';
import multer from 'multer';
import { generateImage, removeBackground } from '../controllers/imageAIController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/generate-image', generateImage);
router.post('/remove-background', upload.single('image'), removeBackground);

export default router;
