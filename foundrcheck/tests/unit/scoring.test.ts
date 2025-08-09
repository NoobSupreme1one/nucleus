import { describe, it, expect } from 'vitest';
import { calculateValidationScore, generateAnalysisSummary } from '@/lib/scoring';
import type { RubricInputs } from '@/lib/scoring';

describe('Scoring Algorithm', () => {
  describe('calculateValidationScore', () => {
    it('should return 100 for perfect inputs', () => {
      const inputs: RubricInputs = {
        market_size: 5,
        competition_intensity: 0, // Lower is better
        novelty: 5,
        execution_complexity: 0, // Lower is better
        monetization_clarity: 5,
      };
      
      const score = calculateValidationScore(inputs);
      expect(score).toBe(100);
    });

    it('should return 0 for worst inputs', () => {
      const inputs: RubricInputs = {
        market_size: 0,
        competition_intensity: 5, // Higher is worse
        novelty: 0,
        execution_complexity: 5, // Higher is worse
        monetization_clarity: 0,
      };
      
      const score = calculateValidationScore(inputs);
      expect(score).toBe(0);
    });

    it('should return 50 for average inputs', () => {
      const inputs: RubricInputs = {
        market_size: 2.5,
        competition_intensity: 2.5,
        novelty: 2.5,
        execution_complexity: 2.5,
        monetization_clarity: 2.5,
      };
      
      const score = calculateValidationScore(inputs);
      expect(score).toBe(50);
    });

    it('should clamp scores between 0 and 100', () => {
      const highInputs: RubricInputs = {
        market_size: 10, // Invalid high value
        competition_intensity: 0,
        novelty: 10,
        execution_complexity: 0,
        monetization_clarity: 10,
      };
      
      const score = calculateValidationScore(highInputs);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateAnalysisSummary', () => {
    it('should generate a comprehensive summary', () => {
      const data = {
        one_sentence: 'This is a revolutionary AI-powered app.',
        market_signals: ['Growing AI market', 'High demand for automation'],
        competitors: [
          { name: 'CompetitorA', brief_note: 'Well-established player' },
          { name: 'CompetitorB', brief_note: 'New entrant' },
        ],
        moat_risks: ['High competition', 'Technical complexity'],
      };

      const summary = generateAnalysisSummary(data);
      
      expect(summary).toContain('This is a revolutionary AI-powered app.');
      expect(summary).toContain('Growing AI market');
      expect(summary).toContain('CompetitorA');
      expect(summary).toContain('High competition');
    });

    it('should handle empty data gracefully', () => {
      const data = {
        one_sentence: 'Basic idea.',
        market_signals: [],
        competitors: [],
        moat_risks: [],
      };

      const summary = generateAnalysisSummary(data);
      expect(summary).toBe('Basic idea.');
    });
  });
});