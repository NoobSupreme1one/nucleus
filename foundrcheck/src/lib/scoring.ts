export interface RubricInputs {
  market_size: number; // 0-5
  competition_intensity: number; // 0-5 (higher is worse)
  novelty: number; // 0-5
  execution_complexity: number; // 0-5 (higher is worse)
  monetization_clarity: number; // 0-5
}

export function calculateValidationScore(inputs: RubricInputs): number {
  // Normalize inputs to 0-1 scale and apply weights
  const marketSize = inputs.market_size / 5 * 0.3;
  const novelty = inputs.novelty / 5 * 0.2;
  const monetization = inputs.monetization_clarity / 5 * 0.2;
  
  // Invert competition and complexity (lower is better)
  const competition = (5 - inputs.competition_intensity) / 5 * 0.15;
  const complexity = (5 - inputs.execution_complexity) / 5 * 0.15;
  
  // Calculate final score (0-1) and convert to 0-100
  const finalScore = marketSize + novelty + monetization + competition + complexity;
  
  // Round and clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(finalScore * 100)));
}

export function generateAnalysisSummary(data: {
  one_sentence: string;
  market_signals: string[];
  competitors: { name: string; brief_note: string }[];
  moat_risks: string[];
}): string {
  const topMarketSignals = data.market_signals.slice(0, 2);
  const topCompetitor = data.competitors[0]?.name;
  const topRisk = data.moat_risks[0];
  
  let summary = data.one_sentence + ' ';
  
  if (topMarketSignals.length > 0) {
    summary += `Market indicators include: ${topMarketSignals.join(', ')}. `;
  }
  
  if (topCompetitor) {
    summary += `Key competitor: ${topCompetitor}. `;
  }
  
  if (topRisk) {
    summary += `Primary risk: ${topRisk}`;
  }
  
  return summary.trim();
}