import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imageName: { type: String, required: true },
    contentType: { type: String, required: true },
    filters: { type: Object, required: true },
    tags: { type: [String], required: true },
    sort: { type: String, default: 'recent' },
    relevanceScore: { type: Number, default: 0 },
    imageHash: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Post = mongoose.model('Post', PostSchema);

export default Post;
