import { Router, Response } from "express";
import { insertSubmissionSchema } from "@shared/validation";
import { upload, getFileUrl, CloudStorageService } from '../services/s3-storage';
import { rateLimiters, conditionalRateLimit } from "../services/rate-limit";
import { getAuthMiddleware } from "../auth/auth-factory";
import { 
  AuthenticatedRequest, 
  asyncHandler, 
  handleRouteError, 
  sendErrorResponse, 
  getStorage
} from "./shared";

export const submissionsRouter = Router();

// Get authenticated middleware
const getAuth = () => getAuthMiddleware();

// Create submission
submissionsRouter.post('/', [
  getAuth(), 
  conditionalRateLimit(rateLimiters.fileUpload),
  upload.array('files', 5)
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const storage = await getStorage();
    
    // Handle file URLs from cloud storage or local storage
    const fileUrls = req.files ? (req.files as any[]).map((file: any) => getFileUrl(file)) : [];
    
    const submissionData = {
      ...req.body,
      userId,
      fileUrls,
      portfolioUrl: req.body.portfolioUrl || null,
      githubUrl: req.body.githubUrl || null,
      liveUrl: req.body.liveUrl || null
    };
    
    const validatedData = insertSubmissionSchema.parse(submissionData);
    const submission = await storage.createSubmission(validatedData);
    
    // Log storage type for monitoring
    console.log(`Submission created with ${CloudStorageService.isConfigured() ? 'cloud' : 'local'} storage`);
    
    res.json(submission);
  } catch (error) {
    handleRouteError(error as Error, req, res, "Failed to create submission");
  }
}));

// Get user submissions
submissionsRouter.get('/', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const storage = await getStorage();
      const submissions = await storage.getUserSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to fetch submissions");
    }
  })
);

// Update submission
submissionsRouter.put('/:id', [
  getAuth(), 
  upload.array('files', 5)
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const storage = await getStorage();
    const submission = await storage.getSubmission(req.params.id);
    
    if (!submission) {
      return sendErrorResponse(res, 404, {
        code: 'SUBMISSION_NOT_FOUND',
        message: "Submission not found"
      });
    }
    
    const userId = req.user.id;
    if (submission.userId !== userId) {
      return sendErrorResponse(res, 403, {
        code: 'ACCESS_DENIED',
        message: "Access denied"
      });
    }
    
    // Handle new file uploads or keep existing files
    const fileUrls = req.files && (req.files as any[]).length > 0 
      ? (req.files as any[]).map((file: any) => getFileUrl(file))
      : submission.fileUrls;
    
    const updatedSubmission = await storage.updateSubmission(req.params.id, {
      ...req.body,
      fileUrls
    });
    
    console.log(`Submission updated with ${CloudStorageService.isConfigured() ? 'cloud' : 'local'} storage`);
    
    res.json(updatedSubmission);
  } catch (error) {
    handleRouteError(error as Error, req, res, "Failed to update submission");
  }
}));