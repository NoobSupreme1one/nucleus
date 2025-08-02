import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nucleus-submissions', // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    transformation: [
      // Optimize images
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
    ],
    public_id: (req: any, file: any) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      return `${file.fieldname}-${uniqueSuffix}${ext}`;
    },
  } as any,
});

// Create multer upload instance with cloud storage
export const uploadToCloud = multer({
  storage: storage,
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

// Cloud storage service class
export class CloudStorageService {
  /**
   * Upload a file to Cloudinary
   */
  static async uploadFile(filePath: string, options: {
    folder?: string;
    public_id?: string;
    transformation?: any[];
  } = {}): Promise<any> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || 'nucleus-uploads',
        public_id: options.public_id,
        transformation: options.transformation,
        resource_type: 'auto', // Automatically detect file type
      });
      
      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  static async deleteFile(public_id: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(public_id);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Get optimized URL for an image
   */
  static getOptimizedUrl(public_id: string, options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}): string {
    return cloudinary.url(public_id, {
      width: options.width,
      height: options.height,
      quality: options.quality || 'auto',
      format: options.format || 'auto',
      crop: 'limit',
    });
  }

  /**
   * Check if Cloudinary is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Get upload stats and usage
   */
  static async getUsageStats(): Promise<any> {
    try {
      return await cloudinary.api.usage();
    } catch (error) {
      console.error('Failed to get Cloudinary usage stats:', error);
      return null;
    }
  }
}

// Fallback to local storage if Cloudinary is not configured
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
export const upload = CloudStorageService.isConfigured() ? uploadToCloud : localStorage;

// Helper to get file URL regardless of storage type
export function getFileUrl(file: any): string {
  if (CloudStorageService.isConfigured() && file.path) {
    // Cloudinary file
    return file.path;
  } else if (file.filename) {
    // Local file
    return `/uploads/${file.filename}`;
  } else {
    // Fallback
    return file.path || file.filename || '';
  }
}