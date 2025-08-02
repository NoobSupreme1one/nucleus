import { PrismaClient } from '@prisma/client';
import type { User, UserPrivacySettings } from '@shared/types';

export class PrivacyManagerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get user privacy settings
   */
  async getUserPrivacySettings(userId: string): Promise<UserPrivacySettings | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          profilePublic: true,
          ideasPublic: true,
          allowFounderMatching: true,
          allowDirectContact: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        profilePublic: user.profilePublic,
        ideasPublic: user.ideasPublic,
        allowFounderMatching: user.allowFounderMatching,
        allowDirectContact: user.allowDirectContact,
      };
    } catch (error) {
      console.error('Error fetching user privacy settings:', error);
      throw new Error('Failed to fetch privacy settings');
    }
  }

  /**
   * Update user privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<UserPrivacySettings>
  ): Promise<UserPrivacySettings> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePublic: settings.profilePublic,
          ideasPublic: settings.ideasPublic,
          allowFounderMatching: settings.allowFounderMatching,
          allowDirectContact: settings.allowDirectContact,
        },
        select: {
          profilePublic: true,
          ideasPublic: true,
          allowFounderMatching: true,
          allowDirectContact: true,
        },
      });

      return {
        profilePublic: updatedUser.profilePublic,
        ideasPublic: updatedUser.ideasPublic,
        allowFounderMatching: updatedUser.allowFounderMatching,
        allowDirectContact: updatedUser.allowDirectContact,
      };
    } catch (error) {
      console.error('Error updating user privacy settings:', error);
      throw new Error('Failed to update privacy settings');
    }
  }

  /**
   * Filter users based on their privacy settings for founder matching
   */
  async filterPublicProfiles(userIds: string[]): Promise<User[]> {
    try {
      const publicUsers = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          profilePublic: true,
          allowFounderMatching: true,
        },
        include: {
          ideas: {
            where: {
              // Only include public ideas
              userId: {
                in: await this.getPublicIdeaUserIds(userIds),
              },
            },
          },
        },
      });

      return publicUsers;
    } catch (error) {
      console.error('Error filtering public profiles:', error);
      throw new Error('Failed to filter public profiles');
    }
  }

  /**
   * Get users who have public ideas
   */
  private async getPublicIdeaUserIds(userIds: string[]): Promise<string[]> {
    const usersWithPublicIdeas = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        ideasPublic: true,
      },
      select: { id: true },
    });

    return usersWithPublicIdeas.map(user => user.id);
  }

  /**
   * Check if a user allows direct contact
   */
  async allowsDirectContact(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { allowDirectContact: true },
      });

      return user?.allowDirectContact ?? false;
    } catch (error) {
      console.error('Error checking direct contact permission:', error);
      return false;
    }
  }

  /**
   * Check if a user's profile is public
   */
  async isProfilePublic(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profilePublic: true },
      });

      return user?.profilePublic ?? false;
    } catch (error) {
      console.error('Error checking profile visibility:', error);
      return false;
    }
  }

  /**
   * Check if a user's ideas are public
   */
  async areIdeasPublic(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { ideasPublic: true },
      });

      return user?.ideasPublic ?? false;
    } catch (error) {
      console.error('Error checking ideas visibility:', error);
      return false;
    }
  }

  /**
   * Check if a user allows founder matching
   */
  async allowsFounderMatching(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { allowFounderMatching: true },
      });

      return user?.allowFounderMatching ?? false;
    } catch (error) {
      console.error('Error checking founder matching permission:', error);
      return false;
    }
  }

  /**
   * Get all users who allow founder matching and have public profiles
   */
  async getMatchableUsers(excludeUserId?: string): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          profilePublic: true,
          allowFounderMatching: true,
          ...(excludeUserId && { id: { not: excludeUserId } }),
        },
        include: {
          ideas: {
            where: {
              userId: {
                in: await this.getPublicIdeaUserIds([]),
              },
            },
          },
        },
      });

      return users;
    } catch (error) {
      console.error('Error fetching matchable users:', error);
      throw new Error('Failed to fetch matchable users');
    }
  }

  /**
   * Validate privacy settings input
   */
  validatePrivacySettings(settings: Partial<UserPrivacySettings>): boolean {
    const validKeys = ['profilePublic', 'ideasPublic', 'allowFounderMatching', 'allowDirectContact'];
    
    for (const key in settings) {
      if (!validKeys.includes(key)) {
        return false;
      }
      
      if (typeof settings[key as keyof UserPrivacySettings] !== 'boolean') {
        return false;
      }
    }

    return true;
  }
}
