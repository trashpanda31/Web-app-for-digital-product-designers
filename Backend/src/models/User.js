import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        username: { type: String, required: true, unique: true },
        email: { type: String, unique: true, sparse: true, required: false },
        password: { type: String, required: function () { return !this.isOAuth; } },
        googleId: { type: String, sparse: true },
        gitlabId: { type: String, sparse: true },
        isOAuth: { type: Boolean, default: false },
        refreshToken: { type: String, default: null },
        avatarUrl: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
