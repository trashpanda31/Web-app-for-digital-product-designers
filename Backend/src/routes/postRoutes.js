import express from 'express';
import multer from 'multer';
import {
    createPost,
    searchPostsByTitle,
    filterPosts,
    sortPosts,
    searchPostsByImage,
    redirectToGoogleImageSearch,
    deletePost,
    toggleLikePost,
    createComment,
    getCommentsByPost,
    deleteComment,
    updatePost,
    cleanupTempFile,
    getUserPosts,
    getPostById,
    upload,
    downloadPostImage
} from '../controllers/postController.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const memoryUpload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get('/search', searchPostsByTitle);
router.post('/search-images', memoryUpload.single('image'), searchPostsByImage);
router.post('/search-google', memoryUpload.single('image'), redirectToGoogleImageSearch);

router.post('/create', authMiddleware, memoryUpload.single('image'), createPost);
router.get('/my', authMiddleware, getUserPosts);
router.put('/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }]), updatePost);
router.delete('/:id', authMiddleware, deletePost);

router.post('/:id/like', authMiddleware, toggleLikePost);
router.post('/:postId/comments', authMiddleware, createComment);
router.get('/:postId/comments', getCommentsByPost);
router.delete('/comments/:id', authMiddleware, deleteComment);

router.get('/filter', filterPosts);
router.get('/sort', sortPosts);

router.post('/cleanup-temp', cleanupTempFile);

router.get('/:id', getPostById);
router.get('/:id/download', downloadPostImage);

export default router;
