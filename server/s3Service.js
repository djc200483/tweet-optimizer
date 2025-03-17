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
    console.log('Starting S3 upload process:', { imageUrl, key });
    try {
        // Download image from URL
        console.log('Downloading image from URL...');
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);
        console.log('Image downloaded successfully, size:', imageBuffer.length, 'bytes');

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: imageBuffer,
            ContentType: response.headers['content-type']
        });

        console.log('Uploading to S3 bucket:', process.env.AWS_BUCKET_NAME);
        await s3Client.send(command);
        console.log('Upload to S3 successful');

        // Generate signed URL for immediate access
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        console.log('Generated signed URL');

        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log('S3 URL generated:', s3Url);

        return {
            success: true,
            s3Url: s3Url,
            signedUrl
        };
    } catch (error) {
        console.error('Error in uploadImageToS3:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            imageUrl,
            key,
            bucket: process.env.AWS_BUCKET_NAME,
            region: process.env.AWS_REGION
        });
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    uploadImageToS3
}; 