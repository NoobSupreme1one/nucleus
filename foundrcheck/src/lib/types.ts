export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  created: string;
  updated: string;
}

export interface Idea extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  status: 'queued' | 'analyzing' | 'scored' | 'failed';
  analysis_raw?: Record<string, unknown>; // Full Perplexity response
  analysis_summary?: string;
  score?: number;
  owner: string;
  expand?: {
    owner?: User;
  };
  created: string;
  updated: string;
}

export interface PerplexityResponse {
  one_sentence: string;
  market_signals: string[];
  competitors: { name: string; brief_note: string }[];
  moat_risks: string[];
  go_to_market: string[];
  monetization: string[];
  feasibility_factors: string[];
  rubric_inputs: {
    market_size: number;
    competition_intensity: number;
    novelty: number;
    execution_complexity: number;
    monetization_clarity: number;
  };
}

export interface LeaderboardEntry extends Record<string, unknown> {
  id: string;
  title: string;
  analysis_summary?: string;
  score: number;
  created: string;
  expand?: {
    owner?: {
      id: string;
      username: string;
      name: string;
      avatar?: string;
    };
  };
}