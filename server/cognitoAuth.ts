import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { accountLockoutProtection, trackLoginAttempt } from './middleware/security';
import { createHmac } from 'crypto';

// Initialize AWS Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID!;
const clientId = process.env.AWS_COGNITO_CLIENT_ID!;
const clientSecret = process.env.AWS_COGNITO_CLIENT_SECRET!;

function getUserAttribute(attributes: any[] | undefined, name: string): string | undefined {
  if (!attributes) return undefined;
  const attr = attributes.find(a => a.Name === name);
  return attr?.Value;
}

function calculateSecretHash(username: string): string | undefined {
  if (!clientSecret) return undefined;
  return createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    // Try to get token from Authorization header first, then from cookies
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Verify the JWT token with AWS Cognito
    const command = new GetUserCommand({
      AccessToken: token,
    });
    
    const response = await cognitoClient.send(command);
    
    if (!response.Username) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Create user object matching existing format
    const user = {
      id: response.Username,
      email: getUserAttribute(response.UserAttributes, 'email') || '',
      user_metadata: {
        first_name: getUserAttribute(response.UserAttributes, 'given_name'),
        last_name: getUserAttribute(response.UserAttributes, 'family_name'),
        avatar_url: getUserAttribute(response.UserAttributes, 'picture'),
      }
    };

    // Get or create user in our database
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      // Create user if they don't exist
      await storage.upsertUser({
        email: user.email || null,
        firstName: user.user_metadata?.first_name || null,
        lastName: user.user_metadata?.last_name || null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
        role: null,
        location: null,
        bio: null,
        subscriptionTier: 'free',
        totalIdeaScore: 0,
        profileViews: 0,
        profilePublic: true,
        ideasPublic: true,
        allowFounderMatching: true,
        allowDirectContact: true,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        subscriptionCancelAtPeriodEnd: false,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Cognito auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Setup authentication routes
export async function setupAuth(app: Express) {
  // Login endpoint - handle email/password authentication
  app.post('/api/auth/login', accountLockoutProtection(), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Sign in with AWS Cognito (use email since user pool is configured with email alias)
      const authParameters: any = {
        USERNAME: email,
        PASSWORD: password,
      };
      
      const secretHash = calculateSecretHash(email);
      if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
      }
      
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: authParameters,
      });

      const response = await cognitoClient.send(command);

      if (!response.AuthenticationResult?.AccessToken) {
        // Track failed login attempt
        trackLoginAttempt(false, email);
        return res.status(401).json({ message: 'Login failed' });
      }

      // Track successful login
      trackLoginAttempt(true, email);

      const accessToken = response.AuthenticationResult.AccessToken;
      const refreshToken = response.AuthenticationResult.RefreshToken;

      // Set cookies with tokens
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      if (refreshToken) {
        res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      // Get user details
      const userCommand = new GetUserCommand({
        AccessToken: accessToken,
      });
      
      const userResponse = await cognitoClient.send(userCommand);
      
      if (!userResponse.Username) {
        return res.status(401).json({ message: 'Failed to get user details' });
      }

      const userEmail = getUserAttribute(userResponse.UserAttributes, 'email') || email;

      // Get or create user in our database
      await storage.upsertUser({
        email: userEmail || null,
        firstName: getUserAttribute(userResponse.UserAttributes, 'given_name') || null,
        lastName: getUserAttribute(userResponse.UserAttributes, 'family_name') || null,
        profileImageUrl: getUserAttribute(userResponse.UserAttributes, 'picture') || null,
        role: null,
        location: null,
        bio: null,
        subscriptionTier: 'free',
        totalIdeaScore: 0,
        profileViews: 0,
        profilePublic: true,
        ideasPublic: true,
        allowFounderMatching: true,
        allowDirectContact: true,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        subscriptionCancelAtPeriodEnd: false,
      });

      res.json({ 
        message: 'Logged in successfully',
        user: await storage.getUser(userResponse.Username)
      });
    } catch (error) {
      console.error('Cognito login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Generate a unique username (not using email as username due to alias configuration)
      const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Sign up with AWS Cognito
      const signUpParams: any = {
        ClientId: clientId,
        Username: username,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'name',
            Value: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
          },
          ...(firstName ? [{
            Name: 'given_name',
            Value: firstName,
          }] : []),
          ...(lastName ? [{
            Name: 'family_name',
            Value: lastName,
          }] : []),
        ],
      };
      
      const secretHash = calculateSecretHash(username);
      if (secretHash) {
        signUpParams.SecretHash = secretHash;
      }
      
      const command = new SignUpCommand(signUpParams);

      const response = await cognitoClient.send(command);

      if (!response.UserSub) {
        return res.status(400).json({ message: 'Registration failed' });
      }

      // Check if user is auto-confirmed (like in development mode)
      const needsConfirmation = !response.UserSub;

      if (!needsConfirmation) {
        // Create user in our database
        await storage.upsertUser({
          email: email || null,
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: null,
          role: null,
          location: null,
          bio: null,
          subscriptionTier: 'free',
          totalIdeaScore: 0,
          profileViews: 0,
          profilePublic: true,
          ideasPublic: true,
          allowFounderMatching: true,
          allowDirectContact: true,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
          subscriptionPeriodEnd: null,
          subscriptionCancelAtPeriodEnd: false,
        });

        res.json({ 
          message: 'Registration successful',
          user: await storage.getUser(response.UserSub)
        });
      } else {
        // User needs to confirm email
        res.json({ 
          message: 'Registration successful. Please check your email to confirm your account.',
          needsConfirmation: true
        });
      }
    } catch (error) {
      console.error('Cognito registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Confirm signup endpoint
  app.post('/api/auth/confirm', async (req, res) => {
    try {
      const { email, confirmationCode } = req.body;
      
      if (!email || !confirmationCode) {
        return res.status(400).json({ message: 'Email and confirmation code are required' });
      }

      const confirmParams: any = {
        ClientId: clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      };
      
      const secretHash = calculateSecretHash(email);
      if (secretHash) {
        confirmParams.SecretHash = secretHash;
      }
      
      const command = new ConfirmSignUpCommand(confirmParams);

      await cognitoClient.send(command);

      res.json({ message: 'Account confirmed successfully' });
    } catch (error) {
      console.error('Cognito confirmation error:', error);
      res.status(400).json({ message: 'Confirmation failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req, res) => {
    try {
      // Get token from header or cookie
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
      }

      if (token) {
        // Sign out from AWS Cognito
        const command = new GlobalSignOutCommand({
          AccessToken: token,
        });
        await cognitoClient.send(command);
      }

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Cognito logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile endpoint
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role, location, bio } = req.body;
      
      const updatedUser = await storage.upsertUser({
        email: req.user.email || null,
        firstName: req.user.user_metadata?.first_name || null,
        lastName: req.user.user_metadata?.last_name || null,
        profileImageUrl: req.user.user_metadata?.avatar_url || null,
        role: role || null,
        location: location || null,
        bio: bio || null,
        subscriptionTier: 'free',
        totalIdeaScore: 0,
        profileViews: 0,
        profilePublic: true,
        ideasPublic: true,
        allowFounderMatching: true,
        allowDirectContact: true,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        subscriptionCancelAtPeriodEnd: false,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
}