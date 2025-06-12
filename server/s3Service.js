const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Log S3 configuration on startup
console.log('S3 Configuration:', {
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_BUCKET_NAME,
    hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

// Upload image to S3
async function uploadImageToS3(imageUrl, key) {
    try {
        // Download image from URL with streaming
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer',
            // Add timeout and better error handling
            timeout: 10000,
            maxContentLength: 10 * 1024 * 1024 // 10MB max
        });

        const imageBuffer = Buffer.from(response.data);

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: imageBuffer,
            ContentType: response.headers['content-type'],
            // Add caching headers
            CacheControl: 'public, max-age=31536000' // 1 year
        });

        await s3Client.send(command);
        
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        
        return {
            success: true,
            s3Url: s3Url
        };
    } catch (error) {
        console.error('Error in uploadImageToS3:', {
            message: error.message,
            code: error.code,
            imageUrl,
            key
        });
        return {
            success: false,
            error: error.message
        };
    }
}

// Upload image buffer to S3
async function uploadImageBufferToS3(buffer, key) {
    try {
        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/png',
            CacheControl: 'public, max-age=31536000'
        });
        await s3Client.send(command);
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return {
            success: true,
            s3Url: s3Url
        };
    } catch (error) {
        console.error('Error in uploadImageBufferToS3:', {
            message: error.message,
            code: error.code,
            key
        });
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    uploadImageToS3,
    uploadImageBufferToS3
}; 