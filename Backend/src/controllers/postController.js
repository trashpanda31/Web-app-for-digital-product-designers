import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import Post from '../models/Post.js';
import { s3 } from '../config/s3.js';
import { sendMail } from '../utils/mailer.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import multer from 'multer';
import os from 'os';

const require = createRequire(import.meta.url);
const imageHashModule = require('image-hash');
const imageHash = imageHashModule.imageHash || imageHashModule;

export const createPost = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: 'Unauthorized: user not found in request. Please check your authorization token and authMiddleware.' });
        }

        const { title, filters, tags, sort } = req.body;

        let parsedFilters;
        try {
            parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
        } catch (e) {
            parsedFilters = {};
        }
        let parsedTags = [];
        if (Array.isArray(tags)) {
            parsedTags = tags;
        } else if (typeof tags === 'string') {
            if (tags.includes(',')) {
                parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
            } else if (tags.trim()) {
                parsedTags = [tags.trim()];
            }
        }

        if (!title?.trim() || !req.file || !parsedTags.length || !parsedFilters || Object.keys(parsedFilters).length === 0) {
            return res.status(400).json({ message: 'Missing required fields', debug: { title, file: !!req.file, tags: parsedTags, filters: parsedFilters } });
        }

        let imageUrl, imageName, contentType;

        if (req.file.location && req.file.key) {
            imageUrl = req.file.location;
            imageName = req.file.key;
            contentType = req.file.mimetype;
        } else if (req.file.buffer) {
            imageName = `posts/${Date.now()}-${req.file.originalname}`;
            await s3.upload({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: imageName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            }).promise();
            imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageName}`;
            contentType = req.file.mimetype;
        } else {
            return res.status(500).json({ message: 'Image upload error (no file data)' });
        }

        const tempPath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`);
        fs.writeFileSync(tempPath, req.file.buffer);

        const imageHashValue = await new Promise((resolve, reject) => {
            imageHash(tempPath, 16, true, (error, data) => {
                if (error) reject(error);
                else resolve(data);
            });
        });

        fs.unlinkSync(tempPath);

        const newPost = new Post({
            title,
            imageUrl,
            imageName,
            contentType,
            filters: parsedFilters,
            tags: parsedTags,
            sort: sort || 'recent',
            userId: req.user.userId,
            imageHash: imageHashValue
        });

        await newPost.save();
        res.status(201).json({ message: 'Post successfully created', post: newPost });
    } catch (error) {
        console.error('createPost error:', error);
        res.status(500).json({ message: 'Error while creating post', error: error.message });
    }
};

export const searchPostsByImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image file not uploaded' });
        }

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const tempPath = path.join(__dirname, '../../tmp', req.file.originalname);
        fs.writeFileSync(tempPath, req.file.buffer);

        let searchHash;
        try {
            searchHash = await new Promise((resolve, reject) => {
                imageHash(tempPath, 16, true, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
        } catch (err) {
            return res.status(500).json({ message: 'Error while hashing image', error: err.message });
        } finally {
            fs.unlink(tempPath, unlinkErr => {
                if (unlinkErr) console.warn('Failed to delete temp file:', unlinkErr);
            });
        }

        const posts = await Post.find({ imageHash: { $exists: true } })
          .populate('userId', 'username avatarUrl');

        const MAX_DISTANCE      = 200;
        const WEIGHT_DISTANCE   = 0.1;
        const WEIGHT_COLOR      = 0.1;
        const WEIGHT_STRUCT     = 0.1;
        const SCORE_THRESHOLD   = 0.1;
        const TOP_N             = 1000;

        const results = posts
          .filter(post => {
              const d = hammingDistance(searchHash, post.imageHash);
              return d <= MAX_DISTANCE;
          })
          .map(post => {
              const d = hammingDistance(searchHash, post.imageHash);
              const normD = d / searchHash.length;
              const sim = 1 - normD;

              const colorA = searchHash.slice(0, 8);
              const colorB = post.imageHash.slice(0, 8);
              const structA = searchHash.slice(8);
              const structB = post.imageHash.slice(8);

              const colorSim = 1 - hammingDistance(colorA, colorB) / colorA.length;
              const structSim = 1 - hammingDistance(structA, structB) / structA.length;

              const weightedScore =
                sim          * WEIGHT_DISTANCE +
                colorSim     * WEIGHT_COLOR +
                structSim    * WEIGHT_STRUCT;

              return {
                  ...post.toObject(),
                  distance: d,
                  similarity: sim,
                  colorSimilarity: colorSim,
                  structureSimilarity: structSim,
                  weightedScore
              };
          })
          .filter(item => item.weightedScore >= SCORE_THRESHOLD)
          .sort((a, b) => b.weightedScore - a.weightedScore)
          .slice(0, TOP_N);

        res.status(200).json({ results });
    } catch (error) {
        console.error('searchPostsByImage error:', error);
        res.status(500).json({ message: 'Error while searching posts by image', error: error.message });
    }
};

function hammingDistance(hash1, hash2) {
    if (hash1.length !== hash2.length) return Infinity;
    let dist = 0;
    for (let i = 0; i < hash1.length; i++) {
        const n1 = parseInt(hash1[i], 16);
        const n2 = parseInt(hash2[i], 16);
        dist += countBits(n1 ^ n2);
    }
    return dist;
}

function countBits(n) {
    return [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4][n];
}

export const searchPostsByTitle = async (req, res) => {
    try {
        const { query, type } = req.query;
        let posts = await Post.find({ title: { $regex: query, $options: 'i' } })
            .populate('userId', 'username avatarUrl');

        if (type === 'popular') {
            posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        } else if (type === 'relevant') {
            const postsWithCounts = await Post.aggregate([
                { $match: { title: { $regex: query, $options: 'i' } } },
                {
                    $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'postId',
                        as: 'commentsArr'
                    }
                },
                {
                    $addFields: {
                        commentsCount: { $size: '$commentsArr' },
                        likesCount: { $size: '$likes' },
                        recentnessScore: {
                            $divide: [1, { $add: [{ $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24] }, 1] }]
                        }
                    }
                },
                {
                    $addFields: {
                        relevance: {
                            $add: [
                                { $multiply: ['$likesCount', 2] },
                                '$commentsCount',
                                '$recentnessScore'
                            ]
                        }
                    }
                },
                { $sort: { relevance: -1 } }
            ]);
            const ids = postsWithCounts.map(p => p._id);
            posts = await Post.find({ _id: { $in: ids } })
                .populate('userId', 'username avatarUrl')
                .lean();
            posts = ids.map(id => posts.find(p => p._id.toString() === id.toString()));
        } else {
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error while searching by title', error: error.message });
    }
};

export const filterPosts = async (req, res) => {
    try {
        const filter = {};
        const { tags, assetType, aiGenerated, color, people, fileType, style, orientation, type } = req.query;

        if (tags) {
            filter.tags = { $in: tags.split(',').map(tag => new RegExp(`^${tag.trim()}$`, 'i')) };
        }
        if (assetType) filter['filters.assetType'] = assetType;
        if (aiGenerated) filter['filters.aiGenerated'] = aiGenerated;
        if (color) filter['filters.color'] = color;
        if (people) filter['filters.people'] = people;
        if (fileType) filter['filters.fileType'] = fileType;
        if (style) filter['filters.style'] = style;
        if (orientation) filter['filters.orientation'] = orientation;

        let posts = [];
        if (type === 'popular') {
            posts = await Post.find(filter)
                .populate('userId', 'username avatarUrl')
                .lean();
            posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        } else if (type === 'relevant') {
            const postsWithCounts = await Post.aggregate([
                { $match: filter },
                {
                    $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'postId',
                        as: 'commentsArr'
                    }
                },
                {
                    $addFields: {
                        commentsCount: { $size: '$commentsArr' },
                        likesCount: { $size: '$likes' },
                        recentnessScore: {
                            $divide: [1, { $add: [{ $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24] }, 1] }]
                        }
                    }
                },
                {
                    $addFields: {
                        relevance: {
                            $add: [
                                { $multiply: ['$likesCount', 2] },
                                '$commentsCount',
                                '$recentnessScore'
                            ]
                        }
                    }
                },
                { $sort: { relevance: -1 } }
            ]);
            const ids = postsWithCounts.map(p => p._id);
            const postsPopulated = await Post.find({ _id: { $in: ids } }).populate('userId', 'username avatarUrl').lean();
            posts = ids.map(id => postsPopulated.find(p => p._id.toString() === id.toString()));
        } else {
            posts = await Post.find(filter)
                .sort({ createdAt: -1 })
                .populate('userId', 'username avatarUrl')
                .lean();
        }
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error while filtering posts', error: error.message });
    }
};

export const sortPosts = async (req, res) => {
    try {
        const { type, query, tags } = req.query;
        let filter = {};
        if (query) {
            filter.title = { $regex: query, $options: 'i' };
        }
        if (tags) {
            filter.tags = { $in: tags.split(',').map(tag => new RegExp(`^${tag.trim()}$`, 'i')) };
        }

        let posts = [];
        if (type === 'popular') {
            posts = await Post.find(filter)
                .populate('userId', 'username avatarUrl')
                .lean();
            posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        } else if (type === 'relevant') {
            const postsWithCounts = await Post.aggregate([
                { $match: filter },
                {
                    $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'postId',
                        as: 'commentsArr'
                    }
                },
                {
                    $addFields: {
                        commentsCount: { $size: '$commentsArr' },
                        likesCount: { $size: '$likes' },
                        recentnessScore: {
                            $divide: [1, { $add: [{ $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24] }, 1] }]
                        }
                    }
                },
                {
                    $addFields: {
                        relevance: {
                            $add: [
                                { $multiply: ['$likesCount', 2] },
                                '$commentsCount',
                                '$recentnessScore'
                            ]
                        }
                    }
                },
                { $sort: { relevance: -1 } }
            ]);
            const ids = postsWithCounts.map(p => p._id);
            const postsPopulated = await Post.find({ _id: { $in: ids } }).populate('userId', 'username avatarUrl').lean();
            posts = ids.map(id => postsPopulated.find(p => p._id.toString() === id.toString()));
        } else {
            posts = await Post.find(filter)
                .sort({ createdAt: -1 })
                .populate('userId', 'username avatarUrl')
                .lean();
        }
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error while sorting posts', error: error.message });
    }
};

export const redirectToGoogleImageSearch = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image file not uploaded' });
        }

        let imageUrl, imageKey;
        if (req.file.location && req.file.key) {
            imageUrl = req.file.location;
            imageKey = req.file.key;
        } else if (req.file.buffer) {
            imageKey = `temp/${Date.now()}-${req.file.originalname}`;
            await s3.upload({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: imageKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            }).promise();
            imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
        } else {
            return res.status(500).json({ message: 'Image upload error (no file data)' });
        }

        const encodedImageUrl = encodeURIComponent(imageUrl);
        const googleLensUrl = `https://lens.google.com/uploadbyurl?url=${encodedImageUrl}`;

        res.status(200).json({
            imageUrl: imageUrl,
            redirectUrl: googleLensUrl
        });

        setTimeout(async () => {
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: imageKey
                }).promise();
            } catch (deleteError) {
                console.error('Error cleaning up temporary file:', deleteError);
            }
        }, 30 * 1000);

    } catch (error) {
        res.status(500).json({ 
            message: 'Error while generating Google Image Search request', 
            error: error.message 
        });
    }
};

export const cleanupTempFile = async (req, res) => {
    try {
        const { file } = req.query;
        if (!file) {
            return res.status(400).json({ message: 'File name not provided' });
        }

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const tempPath = path.join(__dirname, '../../public/temp', file);

        if (fs.existsSync(tempPath) && tempPath.includes('public/temp')) {
            fs.unlinkSync(tempPath);
        }

        res.status(200).json({ message: 'Cleanup completed' });
    } catch (error) {
        console.error('Error cleaning up temp file:', error);
        res.status(500).json({ message: 'Error during cleanup', error: error.message });
    }
};

export const toggleLikePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId || req.user._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not found in token' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const alreadyLiked = post.likes.map(id => id.toString()).includes(userId.toString());

        if (alreadyLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            liked: !alreadyLiked,
            totalLikes: post.likes.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error while liking post', error: error.message });
    }
};

export const createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const { postId } = req.params;

        if (!text?.trim()) {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        const userId = req.user._id || req.user.userId;
        const newComment = new Comment({
            postId,
            userId,
            text: text.trim()
        });

        await newComment.save();
        const populatedComment = await Comment.findById(newComment._id).populate('userId', 'username avatarUrl email');
        const post = await Post.findById(postId);
        if (post && post.userId.toString() !== userId.toString()) {
            const author = await User.findById(post.userId);
            if (author?.email) {
                await sendMail(
                  author.email,
                  'New comment on your post!',
                  `<p>Your post <strong>"${post.title}"</strong> received a new comment:</p>
             <p>${text}</p>
             <p>ST79687 Web APP for digital product designers</p>`
                );
            }
        }

        res.status(201).json({ message: 'Comment added', comment: populatedComment });
    } catch (error) {
        res.status(500).json({ message: 'Error while creating comment', error: error.message });
    }
};

export const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ postId })
          .populate('userId', 'username avatarUrl email')
          .sort({ createdAt: -1 });

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error while retrieving comments', error: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        await comment.deleteOne();
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error while deleting comment', error: error.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id || req.user.userId;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You do not have permission to delete this post' });
        }

        const sameImagePosts = await Post.find({ imageName: post.imageName });
        if (sameImagePosts.length === 1) {
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: post.imageName
                }).promise();
            } catch (s3err) {
                console.error('Error deleting image from S3:', s3err.message);
            }
        }

        await post.deleteOne();
        res.status(200).json({ message: 'Post successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error while deleting post', error: error.message });
    }
};

const upload = multer({ storage: multer.memoryStorage() });

export { upload };

export const updatePost = async (req, res) => {
    try {
        if (!req.user || (!req.user._id && !req.user.userId)) {
            return res.status(401).json({ message: 'Unauthorized: user not found in request. Please check your authorization token and authMiddleware.' });
        }
        const userId = req.user._id || req.user.userId;
        const postId = req.params.id;
        const { title, filters, tags, sort } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You do not have permission to edit this post' });
        }

        if (typeof title !== 'undefined' && title.trim()) {
            post.title = title;
        }

        if (typeof tags !== 'undefined') {
            let parsedTags = [];
            if (Array.isArray(tags)) {
                parsedTags = tags;
            } else if (typeof tags === 'string') {
                if (tags.includes(',')) {
                    parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                } else if (tags.trim()) {
                    parsedTags = [tags.trim()];
                }
            }
            post.tags = parsedTags;
        }

        if (typeof filters !== 'undefined') {
            let parsedFilters;
            try {
                parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
            } catch (e) {
                parsedFilters = {};
            }
            post.filters = parsedFilters;
        }

        if (typeof sort !== 'undefined' && sort.trim()) {
            post.sort = sort;
        }

        let imageFile = req.files && req.files['image'] && req.files['image'][0];

        if (imageFile) {
            await s3.deleteObject({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: post.imageName
            }).promise();

            const imageName = `posts/${Date.now()}-${imageFile.originalname}`;
            await s3.upload({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: imageName,
                Body: imageFile.buffer,
                ContentType: imageFile.mimetype
            }).promise();

            post.imageName = imageName;
            post.imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageName}`;
            post.contentType = imageFile.mimetype;

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const tempDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const tempPath = path.join(tempDir, imageFile.originalname);
            fs.writeFileSync(tempPath, imageFile.buffer);

            const imageHashValue = await new Promise((resolve, reject) => {
                imageHash(tempPath, 16, true, (error, data) => {
                    if (error) reject(error);
                    else resolve(data);
                });
            });

            fs.unlinkSync(tempPath);
            post.imageHash = imageHashValue;
        }

        await post.save();
        console.log(`Post updated: ${post._id}`);
        res.status(200).json({ message: 'Post successfully updated', post });
    } catch (error) {
        console.error('updatePost error:', error);
        res.status(500).json({ message: 'Error while updating post', error: error.message });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const posts = await Post.find({ userId }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user posts', error: error.message });
    }
};

export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ message: 'Post not found' })
        res.json(post)
    } catch (e) {
        res.status(500).json({ message: 'Error fetching post', error: e.message })
    }
}

export const downloadPostImage = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post || !post.imageName) {
            return res.status(404).json({ error: 'Post or image not found' });
        }

        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: post.imageName
        };
        const s3Object = await s3.getObject(s3Params).promise();

        let ext = 'jpg';
        if (post.contentType === 'image/png') ext = 'png';
        else if (post.contentType === 'image/webp') ext = 'webp';
        else if (post.contentType === 'image/gif') ext = 'gif';
        else if (post.contentType === 'image/svg+xml') ext = 'svg';

        const fileName = post.title
            ? `${post.title.replace(/[^a-zA-Z0-9-_\.]/g, '_')}.${ext}`
            : `image.${ext}`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', post.contentType || 'image/jpeg');

        if (Buffer.isBuffer(s3Object.Body)) {
            res.end(s3Object.Body);
        } else if (s3Object.Body instanceof Uint8Array) {
            res.end(Buffer.from(s3Object.Body));
        } else if (typeof s3Object.Body.pipe === 'function') {
            s3Object.Body.pipe(res);
        } else {
            res.status(500).json({ error: 'Unknown S3 Body type' });
        }
    } catch (err) {
        console.error('Download proxy error:', err);
        res.status(500).json({ error: 'Failed to download image' });
    }
};


