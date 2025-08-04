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
import type { AuthProvider, AuthUser, LoginCredentials, RegisterCredentials } from './auth-interface';

export class CognitoAuthProvider implements AuthProvider {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
    
    this.userPoolId = process.env.AWS_COGNITO_USER_POOL_ID!;
    this.clientId = process.env.AWS_COGNITO_CLIENT_ID!;

    if (!this.userPoolId || !this.clientId) {
      throw new Error('AWS Cognito configuration missing. Please set AWS_COGNITO_USER_POOL_ID and AWS_COGNITO_CLIENT_ID');
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; accessToken: string; refreshToken?: string }> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: credentials.email,
          PASSWORD: credentials.password,
        },
      });

      const response = await this.client.send(command);
      
      if (!response.AuthenticationResult?.AccessToken) {
        throw new Error('Authentication failed');
      }

      const accessToken = response.AuthenticationResult.AccessToken;
      const refreshToken = response.AuthenticationResult.RefreshToken;

      // Get user details
      const userCommand = new GetUserCommand({
        AccessToken: accessToken,
      });
      
      const userResponse = await this.client.send(userCommand);
      
      if (!userResponse.Username) {
        throw new Error('Failed to get user details');
      }

      const user: AuthUser = {
        id: userResponse.Username,
        email: credentials.email,
        user_metadata: {
          first_name: this.getUserAttribute(userResponse.UserAttributes, 'given_name'),
          last_name: this.getUserAttribute(userResponse.UserAttributes, 'family_name'),
          avatar_url: this.getUserAttribute(userResponse.UserAttributes, 'picture'),
        }
      };

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Cognito login error:', error);
      throw new Error('Login failed');
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: AuthUser; needsConfirmation: boolean; accessToken?: string; refreshToken?: string }> {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: credentials.email,
        Password: credentials.password,
        UserAttributes: [
          {
            Name: 'email',
            Value: credentials.email,
          },
          ...(credentials.firstName ? [{
            Name: 'given_name',
            Value: credentials.firstName,
          }] : []),
          ...(credentials.lastName ? [{
            Name: 'family_name',
            Value: credentials.lastName,
          }] : []),
        ],
      });

      const response = await this.client.send(command);
      
      if (!response.UserSub) {
        throw new Error('Registration failed');
      }

      const user: AuthUser = {
        id: response.UserSub,
        email: credentials.email,
        user_metadata: {
          first_name: credentials.firstName,
          last_name: credentials.lastName,
        }
      };

      // Check if user is auto-confirmed (development mode)
      const needsConfirmation = !response.UserSub;

      return {
        user,
        needsConfirmation,
      };
    } catch (error) {
      console.error('Cognito registration error:', error);
      throw new Error('Registration failed');
    }
  }

  async confirmSignUp(email: string, confirmationCode: string): Promise<boolean> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Cognito confirmation error:', error);
      return false;
    }
  }

  async getUser(accessToken: string): Promise<AuthUser | null> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });
      
      const response = await this.client.send(command);
      
      if (!response.Username) {
        return null;
      }

      return {
        id: response.Username,
        email: this.getUserAttribute(response.UserAttributes, 'email') || '',
        user_metadata: {
          first_name: this.getUserAttribute(response.UserAttributes, 'given_name'),
          last_name: this.getUserAttribute(response.UserAttributes, 'family_name'),
          avatar_url: this.getUserAttribute(response.UserAttributes, 'picture'),
        }
      };
    } catch (error) {
      console.error('Cognito get user error:', error);
      return null;
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });
      
      await this.client.send(command);
    } catch (error) {
      console.error('Cognito logout error:', error);
      // Don't throw error for logout as it's not critical
    }
  }

  private getUserAttribute(attributes: any[] | undefined, name: string): string | undefined {
    if (!attributes) return undefined;
    const attr = attributes.find(a => a.Name === name);
    return attr?.Value;
  }
}