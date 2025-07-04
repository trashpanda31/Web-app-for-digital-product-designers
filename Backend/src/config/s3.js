import { S3Client } from '@aws-sdk/client-s3';
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const requiredEnv = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET_NAME'];
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export const verifyS3Connection = async () => {
    try {
        await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
        console.log(`[S3] Connection successful (bucket: ${process.env.AWS_S3_BUCKET_NAME}, region: ${process.env.AWS_REGION})`);
    } catch (error) {
        console.error('[S3] Connection error:', error.message);
        process.exit(1);
    }
};

export const s3Storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        let folder = 'uploads/';
        
        if (req.originalUrl.includes('search-google')) {
            folder = 'temp-search/';
        } else if (req.originalUrl.includes('update-avatar')) {
            folder = 'avatars/';
        } else if (req.originalUrl.includes('create')) {
            folder = 'posts/';
        }
        
        const fullPath = `${folder}${fileName}`;
        cb(null, fullPath);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image uploads are allowed'), false);
    }
};

export const upload = multer({
    storage: s3Storage,
    fileFilter,
});

export const getFileURL = (key) => {
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export { s3 };