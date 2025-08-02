import { PrismaClient } from '@prisma/client';
import type { User, FounderMatch, MarketCategory, Role } from '@shared/types';
import { PrivacyManagerService } from './privacy-manager';

export class FounderMatcherService {
  private prisma: PrismaClient;
  private privacyManager: PrivacyManagerService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.privacyManager = new PrivacyManagerService(prisma);
  }

  /**
   * Find similar founders based on market category and target audience
   */
  async findSimilarFounders(
    userId: string,
    limit: number = 10
  ): Promise<FounderMatch[]> {
    try {
      // Get current user's profile and ideas
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          ideas: true,
        },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Get all matchable users (excluding current user)
      const matchableUsers = await this.privacyManager.getMatchableUsers(userId);

      // Calculate similarity scores
      const founderMatches: FounderMatch[] = [];

      for (const user of matchableUsers) {
        const matchScore = await this.calculateSimilarityScore(currentUser, user);
        
        if (matchScore > 0) {
          const commonInterests = this.findCommonInterests(currentUser, user);
          const complementarySkills = this.findComplementarySkills(currentUser, user);
          const sharedMarketCategories = this.findSharedMarketCategories(currentUser, user);
          const contactAllowed = await this.privacyManager.allowsDirectContact(user.id);

          founderMatches.push({
            user,
            matchScore,
            commonInterests,
            complementarySkills,
            sharedMarketCategories,
            contactAllowed,
          });
        }
      }

      // Sort by match score and return top matches
      return founderMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding similar founders:', error);
      throw new Error('Failed to find similar founders');
    }
  }

  /**
   * Calculate similarity score between two users
   */
  private async calculateSimilarityScore(user1: User & { ideas: any[] }, user2: User & { ideas: any[] }): Promise<number> {
    let score = 0;

    // Market category similarity (30% weight)
    const marketCategoryScore = this.calculateMarketCategoryScore(user1, user2);
    score += marketCategoryScore * 0.3;

    // Role complementarity (25% weight)
    const roleScore = this.calculateRoleScore(user1, user2);
    score += roleScore * 0.25;

    // Location proximity (15% weight)
    const locationScore = this.calculateLocationScore(user1, user2);
    score += locationScore * 0.15;

    // Experience level (15% weight)
    const experienceScore = this.calculateExperienceScore(user1, user2);
    score += experienceScore * 0.15;

    // Bio similarity (10% weight)
    const bioScore = this.calculateBioScore(user1, user2);
    score += bioScore * 0.1;

    // Activity level (5% weight)
    const activityScore = this.calculateActivityScore(user1, user2);
    score += activityScore * 0.05;

    return Math.round(score);
  }

  /**
   * Calculate market category similarity score
   */
  private calculateMarketCategoryScore(user1: User & { ideas: any[] }, user2: User & { ideas: any[] }): number {
    const user1Categories = new Set(user1.ideas.map(idea => idea.marketCategory));
    const user2Categories = new Set(user2.ideas.map(idea => idea.marketCategory));

    if (user1Categories.size === 0 || user2Categories.size === 0) {
      return 0;
    }

    const intersection = new Set([...user1Categories].filter(x => user2Categories.has(x)));
    const union = new Set([...user1Categories, ...user2Categories]);

    return (intersection.size / union.size) * 100;
  }

  /**
   * Calculate role complementarity score
   */
  private calculateRoleScore(user1: User, user2: User): number {
    if (!user1.role || !user2.role) {
      return 50; // Neutral score if roles unknown
    }

    // Define complementary role pairs
    const complementaryPairs: Record<Role, Role[]> = {
      engineer: ['designer', 'marketer'],
      designer: ['engineer', 'marketer'],
      marketer: ['engineer', 'designer'],
    };

    if (user1.role === user2.role) {
      return 30; // Same role, lower complementarity
    }

    if (complementaryPairs[user1.role]?.includes(user2.role)) {
      return 100; // Highly complementary
    }

    return 60; // Different but not specifically complementary
  }

  /**
   * Calculate location proximity score
   */
  private calculateLocationScore(user1: User, user2: User): number {
    if (!user1.location || !user2.location) {
      return 50; // Neutral score if location unknown
    }

    const location1 = user1.location.toLowerCase();
    const location2 = user2.location.toLowerCase();

    if (location1 === location2) {
      return 100; // Same location
    }

    // Check for same city/state/country patterns
    const location1Parts = location1.split(',').map(part => part.trim());
    const location2Parts = location2.split(',').map(part => part.trim());

    let commonParts = 0;
    for (const part1 of location1Parts) {
      for (const part2 of location2Parts) {
        if (part1 === part2) {
          commonParts++;
          break;
        }
      }
    }

    if (commonParts > 0) {
      return Math.min(80, commonParts * 40); // Partial location match
    }

    return 20; // Different locations
  }

  /**
   * Calculate experience level score
   */
  private calculateExperienceScore(user1: User & { ideas: any[] }, user2: User & { ideas: any[] }): number {
    const user1Experience = this.estimateExperience(user1);
    const user2Experience = this.estimateExperience(user2);

    const experienceDiff = Math.abs(user1Experience - user2Experience);
    
    if (experienceDiff === 0) {
      return 100; // Same experience level
    } else if (experienceDiff === 1) {
      return 80; // Close experience levels
    } else if (experienceDiff === 2) {
      return 60; // Moderate difference
    } else {
      return 40; // Large difference
    }
  }

  /**
   * Estimate user experience level based on profile data
   */
  private estimateExperience(user: User & { ideas: any[] }): number {
    let experience = 0;

    // Ideas count contributes to experience
    experience += Math.min(user.ideas.length, 3);

    // Bio length as proxy for experience
    if (user.bio) {
      experience += Math.min(Math.floor(user.bio.length / 100), 2);
    }

    // Account age
    const accountAge = Date.now() - user.createdAt.getTime();
    const monthsOld = accountAge / (1000 * 60 * 60 * 24 * 30);
    experience += Math.min(Math.floor(monthsOld / 6), 3);

    return Math.min(experience, 5); // Cap at 5
  }

  /**
   * Calculate bio similarity score
   */
  private calculateBioScore(user1: User, user2: User): number {
    if (!user1.bio || !user2.bio) {
      return 50; // Neutral if no bio
    }

    const bio1Words = user1.bio.toLowerCase().split(/\s+/);
    const bio2Words = user2.bio.toLowerCase().split(/\s+/);

    const commonWords = bio1Words.filter(word => 
      bio2Words.includes(word) && word.length > 3
    );

    const totalWords = new Set([...bio1Words, ...bio2Words]).size;
    
    if (totalWords === 0) return 0;
    
    return Math.min((commonWords.length / totalWords) * 200, 100);
  }

  /**
   * Calculate activity level score
   */
  private calculateActivityScore(user1: User & { ideas: any[] }, user2: User & { ideas: any[] }): number {
    const user1Activity = this.calculateActivityLevel(user1);
    const user2Activity = this.calculateActivityLevel(user2);

    const activityDiff = Math.abs(user1Activity - user2Activity);
    return Math.max(0, 100 - (activityDiff * 25));
  }

  /**
   * Calculate user activity level
   */
  private calculateActivityLevel(user: User & { ideas: any[] }): number {
    let activity = 0;

    // Recent ideas
    const recentIdeas = user.ideas.filter(idea => {
      const ideaAge = Date.now() - idea.createdAt.getTime();
      return ideaAge < (30 * 24 * 60 * 60 * 1000); // Last 30 days
    });
    activity += recentIdeas.length;

    // Profile completeness
    if (user.bio) activity += 1;
    if (user.location) activity += 1;
    if (user.role) activity += 1;

    return Math.min(activity, 4);
  }

  /**
   * Find common interests between users
   */
  private findCommonInterests(user1: User & { ideas: any[] }, user2: User & { ideas: any[] }): string[] {
    const interests = new Set<string>();

    // Market categories
    const user1Categories = user1.ideas.map(idea => idea.marketCategory);
    const user2Categories = user2.ideas.map(idea => idea.marketCategory);
    
    for (const category of user1Categories) {
      if (user2Categories.includes(category)) {
        interests.add(this.formatMarketCategory(category));
      }
    }

    // Location
    if (user1.location && user2.location && user1.location === user2.location) {
      interests.add(`Based in ${user1.location}`);
    }

    return Array.from(interests);
  }

  /**
   * Find complementary skills between users
   */
  private findComplementarySkills(user1: User, user2: User): string[] {
    const skills: string[] = [];

    if (user1.role && user2.role && user1.role !== user2.role) {
      skills.push(`${this.formatRole(user1.role)} + ${this.formatRole(user2.role)} combination`);
    }

    return skills;
  }

  /**
   * Find shared market categories
   */
  private findSharedMarketCategories(user1: User & { ideas: any[] }, user2: User & { ideas: any[] }): MarketCategory[] {
    const user1Categories = new Set(user1.ideas.map(idea => idea.marketCategory));
    const user2Categories = new Set(user2.ideas.map(idea => idea.marketCategory));

    return Array.from(user1Categories).filter(category => user2Categories.has(category));
  }

  /**
   * Format market category for display
   */
  private formatMarketCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      saas: 'SaaS',
      ecommerce: 'E-commerce',
      fintech: 'FinTech',
      healthtech: 'HealthTech',
      edtech: 'EdTech',
      other: 'Other',
    };

    return categoryMap[category] || category;
  }

  /**
   * Format role for display
   */
  private formatRole(role: string): string {
    const roleMap: Record<string, string> = {
      engineer: 'Engineering',
      designer: 'Design',
      marketer: 'Marketing',
    };

    return roleMap[role] || role;
  }
}
