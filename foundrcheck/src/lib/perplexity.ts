import type { PerplexityResponse } from './types';
import { config } from './config';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

function createPrompt(userIdea: string): string {
  return `System: You are a rigorous startup idea validator. Be concise, factual, and structured.

User: Analyze this startup idea and return a strict JSON object with:
- "one_sentence": 1 sentence summary.
- "market_signals": brief bullet points (market size indicators, growth rates if known, proxies if unknown).
- "competitors": array of {name, brief_note}.
- "moat_risks": brief bullets of risks and differentiation challenges.
- "go_to_market": brief bullets with plausible GTM channels.
- "monetization": brief bullets with 1–3 pricing models.
- "feasibility_factors": bullets (team skills, data access, integrations, regulatory).
- "rubric_inputs": object with numeric 0–5 scores for:
    - market_size
    - competition_intensity (5 = brutal competition; lower is better)
    - novelty
    - execution_complexity (5 = very hard; lower is better)
    - monetization_clarity
Idea: """${userIdea}"""
Return ONLY valid JSON.`;
}

export async function analyzeIdea(idea: string): Promise<PerplexityResponse> {
  if (!config.perplexity.apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const prompt = createPrompt(idea);
  
  const requestBody = {
    model: config.perplexity.model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 2000
  };

  let retries = 2;
  
  while (retries >= 0) {
    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.perplexity.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(45000), // 45s timeout
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in Perplexity response');
      }

      // Try to parse the JSON response
      try {
        const parsed = JSON.parse(content);
        
        // Validate required fields
        if (!parsed.one_sentence || !parsed.rubric_inputs) {
          throw new Error('Invalid response structure');
        }
        
        return parsed as PerplexityResponse;
      } catch (parseError) {
        if (retries === 1) {
          // Retry once with explicit JSON instruction
          requestBody.messages[0].content = prompt + '\n\nRespond with ONLY valid JSON, no other text.';
        } else {
          throw new Error(`Failed to parse Perplexity JSON response: ${parseError}`);
        }
      }
    } catch (error) {
      if (retries === 0) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Perplexity API failed after retries: ${errorMessage}`);
      }
    }
    
    retries--;
    // Wait 1 second before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Perplexity API failed after all retries');
}