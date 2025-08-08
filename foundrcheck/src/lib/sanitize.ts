import type { Idea, LeaderboardEntry } from './types';

export function sanitizeIdea(idea: Idea, isOwner: boolean = false): Partial<Idea> {
  const sanitized: Partial<Idea> = {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    analysis_summary: idea.analysis_summary,
    score: idea.score,
    owner: idea.owner,
    created: idea.created,
    updated: idea.updated,
    expand: idea.expand
  };
  
  // Only include raw analysis for owners
  if (isOwner && idea.analysis_raw) {
    sanitized.analysis_raw = idea.analysis_raw;
  }
  
  return sanitized;
}

export function sanitizeLeaderboardEntry(idea: Idea): LeaderboardEntry {
  return {
    id: idea.id,
    title: idea.title,
    analysis_summary: idea.analysis_summary,
    score: idea.score || 0,
    created: idea.created,
    expand: idea.expand ? {
      owner: idea.expand.owner ? {
        id: idea.expand.owner.id,
        username: idea.expand.owner.username,
        name: idea.expand.owner.name,
        avatar: idea.expand.owner.avatar
      } : undefined
    } : undefined
  };
}