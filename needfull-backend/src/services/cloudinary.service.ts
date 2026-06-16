// WHAT: Cloudinary image upload and management service
// WHY: Centralized image handling for avatars, task images, and receipts with automatic optimization
// FUTURE: Add image moderation/scanning for inappropriate content

import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env';

// WHAT: Configure Cloudinary with credentials from environment
// WHY: Authenticate all upload/delete operations with API key and secret
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// WHAT: Common transformation settings for all image uploads
// WHY: Reduce file size, improve performance on slow networks, protect metadata
const DEFAULT_TRANSFORMATIONS = {
  quality: 'auto' as const,
  fetch_format: 'auto' as const,
  strip_metadata: true,
};

// WHAT: Upload image to Cloudinary with optional transformations
// WHY: Handle avatars (800px max) and task images (1200px max) with auto-optimization
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
  }
): Promise<string> {
  try {
    // WHAT: Build transformation options based on image type and input params
    // WHY: Apply responsive sizing, maintain aspect ratio, auto-format for browsers
    const transformation = {
      ...DEFAULT_TRANSFORMATIONS,
      ...(options?.width && { width: options.width }),
      ...(options?.height && { height: options.height }),
      ...(options?.crop && { crop: options.crop }),
    };

    // WHAT: Upload to Cloudinary using buffer stream
    // WHY: Accept file data directly from multer/form upload without temp files
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `needfull/${folder}`,
          resource_type: 'auto',
          transformation,
        },
        (error, result) => {
          if (error) {
            reject(
              new Error(
                `Cloudinary upload failed for folder '${folder}': ${error.message}`
              )
            );
          } else if (result?.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Cloudinary upload succeeded but no URL returned'));
          }
        }
      );

      // WHAT: Pipe file buffer to Cloudinary upload stream
      // WHY: Stream-based upload handles large files efficiently
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(
      `Image upload to Cloudinary failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// WHAT: Delete image from Cloudinary by public ID
// WHY: Clean up old avatars, task images when users update or delete posts
export async function deleteImage(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    // WHAT: Check if deletion was successful (result_count > 0)
    // WHY: Cloudinary returns success even if file doesn't exist, we want to verify
    if (result.result !== 'ok' && result.result !== 'not_found') {
      throw new Error(`Deletion result: ${result.result}`);
    }
  } catch (error) {
    // WHAT: Log error but don't throw for missing files
    // WHY: Image may have already been deleted, app should continue
    if (error instanceof Error && error.message.includes('not_found')) {
      console.warn(`[Cloudinary] Image not found (already deleted): ${publicId}`);
    } else {
      throw new Error(
        `Failed to delete image from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// WHAT: Upload receipt image without transformations (preserve quality and metadata)
// WHY: Receipts are verification documents that need original quality for auditing
export async function uploadReceipt(fileBuffer: Buffer): Promise<string> {
  try {
    // WHAT: Upload to receipts folder with minimal transformations
    // WHY: Preserve image quality and metadata for verification purposes
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'needfull/receipts',
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          // NOTE: Don't strip metadata on receipts - keep original for audit trail
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary receipt upload failed: ${error.message}`));
          } else if (result?.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(
              new Error('Cloudinary receipt upload succeeded but no URL returned')
            );
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(
      `Receipt upload to Cloudinary failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
