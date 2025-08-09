import { Router, Response } from "express";
import { PrivacyManagerService } from "../services/privacy-manager";
import { getAuthMiddleware } from "../auth/auth-factory";
import { 
  AuthenticatedRequest, 
  asyncHandler, 
  handleRouteError, 
  sendErrorResponse, 
  sendSuccessResponse,
  getStorage,
  getAnalytics
} from "./shared";

export const privacyRouter = Router();

// Get authenticated middleware
const getAuth = () => getAuthMiddleware();

// Get privacy settings
privacyRouter.get('/privacy-settings', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const storage = await getStorage();
      const prisma = (storage as any).prisma;
      const privacyManager = new PrivacyManagerService(prisma);
      const analytics = getAnalytics();

      const privacySettings = await privacyManager.getUserPrivacySettings(userId);

      if (!privacySettings) {
        return sendErrorResponse(res, 404, {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Track privacy settings access
      analytics.trackEvent(userId, 'privacy_settings_viewed', {});

      sendSuccessResponse(res, { privacySettings });
    } catch (error) {
      handleRouteError(error as Error, req, res, 'Failed to fetch privacy settings');
    }
  })
);

// Update privacy settings
privacyRouter.put('/privacy-settings', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const storage = await getStorage();
      const prisma = (storage as any).prisma;
      const privacyManager = new PrivacyManagerService(prisma);
      const analytics = getAnalytics();

      // Validate input data
      if (!privacyManager.validatePrivacySettings(req.body)) {
        return sendErrorResponse(res, 400, {
          code: 'INVALID_INPUT',
          message: 'Invalid privacy settings data. All values must be boolean.'
        });
      }

      const updatedSettings = await privacyManager.updatePrivacySettings(userId, req.body);

      // Track privacy settings update
      analytics.trackEvent(userId, 'privacy_settings_updated', {
        settings: req.body,
      });

      sendSuccessResponse(res, { privacySettings: updatedSettings }, 'Privacy settings updated successfully');
    } catch (error) {
      handleRouteError(error as Error, req, res, 'Failed to update privacy settings');
    }
  })
);