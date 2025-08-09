import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { nanoid } from 'nanoid';

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

// Configure S3 storage for multer
const s3Storage = multerS3({
  s3: s3Client,
  bucket: bucketName,
  key: (req: any, file: any, cb: any) => {
    // Generate unique filename
    const uniqueSuffix = nanoid();
    const ext = path.extname(file.originalname).toLowerCase();
    const folder = 'nucleus-submissions';
    const filename = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req: any, file: any, cb: any) => {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
    });
  },
});

// Create multer upload instance with S3 storage
export const uploadToS3 = multer({
  storage: s3Storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// S3 storage service class
export class S3StorageService {
  /**
   * Upload a file directly to S3
   */
  static async uploadFile(
    buffer: Buffer, 
    filename: string,
    contentType: string,
    options: {
      folder?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<any> {
    try {
      const folder = options.folder || 'nucleus-uploads';
      const key = `${folder}/${filename}`;
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          uploadedAt: new Date().toISOString(),
          ...options.metadata,
        },
      });
      
      const result = await s3Client.send(command);
      
      return {
        url: `https://${bucketName}.s3.${process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
        key: key,
        bucket: bucketName,
        etag: result.ETag,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3 storage');
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  /**
   * Generate a presigned URL for secure access
   */
  static async getPresignedUrl(
    key: string, 
    expiresIn: number = 3600 // 1 hour default
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Get direct public URL (only works if bucket allows public access)
   */
  static getPublicUrl(key: string): string {
    return `https://${bucketName}.s3.${process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  /**
   * Check if S3 is properly configured
   */
  static isConfigured(): boolean {
    // Default to local uploads in development to avoid relying on network/S3.
    if (process.env.NODE_ENV === 'development') return false;
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET_NAME
    );
  }

  /**
   * List files in a folder
   */
  static async listFiles(folder: string = 'nucleus-uploads'): Promise<any[]> {
    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: folder,
        MaxKeys: 100,
      });
      
      const result = await s3Client.send(command);
      return result.Contents || [];
    } catch (error) {
      console.error('S3 list files error:', error);
      return [];
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(key: string): Promise<any> {
    try {
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      const result = await s3Client.send(command);
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      };
    } catch (error) {
      console.error('S3 metadata error:', error);
      return null;
    }
  }
}

// Fallback to local storage if S3 is not configured
const localStorage = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Export the appropriate upload handler based on configuration
export const upload = S3StorageService.isConfigured() ? uploadToS3 : localStorage;

// Helper to get file URL regardless of storage type
export function getFileUrl(file: any): string {
  if (S3StorageService.isConfigured() && file.location) {
    // S3 file - multer-s3 provides location property
    return file.location;
  } else if (S3StorageService.isConfigured() && file.key) {
    // S3 file with key
    return S3StorageService.getPublicUrl(file.key);
  } else if (file.filename) {
    // Local file
    return `/uploads/${file.filename}`;
  } else {
    // Fallback
    return file.path || file.filename || file.location || '';
  }
}

// Backward compatibility exports
export const CloudStorageService = S3StorageService;
export const uploadToCloud = uploadToS3;
