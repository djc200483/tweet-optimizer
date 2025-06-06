const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const db = require('../db');

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function cleanupOldImages() {
    try {
        console.log('Starting cleanup process...');

        // First, get the S3 keys of images to delete
        const exploreImagesToDelete = await db.query(
            `SELECT id, s3_url FROM generated_images 
             WHERE is_private = false 
             AND created_at < NOW() - INTERVAL '15 days'`
        );

        const personalImagesToDelete = await db.query(
            `SELECT id, s3_url FROM generated_images 
             WHERE is_private = true 
             AND created_at < NOW() - INTERVAL '90 days'`
        );

        // Extract S3 keys from URLs
        const getS3Key = (s3Url) => {
            try {
                const url = new URL(s3Url);
                return decodeURIComponent(url.pathname.slice(1)); // Remove leading slash
            } catch (error) {
                console.error('Invalid S3 URL:', s3Url);
                return null;
            }
        };

        // Prepare objects for S3 deletion
        const s3Objects = [...exploreImagesToDelete.rows, ...personalImagesToDelete.rows]
            .map(img => getS3Key(img.s3_url))
            .filter(key => key !== null)
            .map(key => ({ Key: key }));

        if (s3Objects.length > 0) {
            // S3 DeleteObjects can only handle 1000 objects at a time
            for (let i = 0; i < s3Objects.length; i += 1000) {
                const batch = s3Objects.slice(i, i + 1000);
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Delete: { Objects: batch }
                });

                const result = await s3Client.send(deleteCommand);
                console.log(`Deleted ${result.Deleted?.length || 0} objects from S3`);
                
                if (result.Errors?.length > 0) {
                    console.error('Errors during S3 deletion:', result.Errors);
                }
            }
        }

        // Now delete from database
        const deleteExploreResult = await db.query(
            `DELETE FROM generated_images 
             WHERE is_private = false 
             AND created_at < NOW() - INTERVAL '15 days'
             RETURNING id`
        );

        const deletePersonalResult = await db.query(
            `DELETE FROM generated_images 
             WHERE is_private = true 
             AND created_at < NOW() - INTERVAL '90 days'
             RETURNING id`
        );

        console.log('Cleanup completed:', {
            exploreImagesDeleted: deleteExploreResult.rowCount,
            personalImagesDeleted: deletePersonalResult.rowCount,
            s3ObjectsProcessed: s3Objects.length
        });

        return {
            success: true,
            exploreImagesDeleted: deleteExploreResult.rowCount,
            personalImagesDeleted: deletePersonalResult.rowCount,
            s3ObjectsDeleted: s3Objects.length
        };
    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
    }
}

async function deleteImagesByUser(userId) {
    try {
        // Get all S3 keys for this user
        const imagesToDelete = await db.query(
            `SELECT id, s3_url FROM generated_images WHERE user_id = $1`,
            [userId]
        );

        const getS3Key = (s3Url) => {
            try {
                const url = new URL(s3Url);
                return decodeURIComponent(url.pathname.slice(1));
            } catch (error) {
                console.error('Invalid S3 URL:', s3Url);
                return null;
            }
        };

        const s3Objects = imagesToDelete.rows
            .map(img => getS3Key(img.s3_url))
            .filter(key => key !== null)
            .map(key => ({ Key: key }));

        if (s3Objects.length > 0) {
            for (let i = 0; i < s3Objects.length; i += 1000) {
                const batch = s3Objects.slice(i, i + 1000);
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Delete: { Objects: batch }
                });
                await s3Client.send(deleteCommand);
            }
        }

        // Delete from database
        await db.query(
            `DELETE FROM generated_images WHERE user_id = $1`,
            [userId]
        );

        console.log(`Deleted all images for user ${userId}`);
        return { success: true, count: imagesToDelete.rowCount };
    } catch (error) {
        console.error('Error deleting images for user:', error);
        throw error;
    }
}

module.exports = {
    cleanupOldImages,
    deleteImagesByUser
}; 