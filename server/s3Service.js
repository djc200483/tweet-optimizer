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

// Upload image to S3
async function uploadImageToS3(imageUrl, key) {
    try {
        // Download image from URL
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: imageBuffer,
            ContentType: response.headers['content-type']
        });

        await s3Client.send(command);

        // Generate signed URL for immediate access
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return {
            success: true,
            s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
            signedUrl
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    uploadImageToS3
}; 