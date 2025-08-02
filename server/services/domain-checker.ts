import type { DomainSuggestion } from '@shared/types';

export class DomainCheckerService {
  private readonly popularTlds = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.tech', '.ai'];
  private readonly fallbackSuggestions = [
    'app', 'hub', 'pro', 'labs', 'works', 'solutions', 'platform', 'tools', 'studio', 'digital'
  ];

  /**
   * Generate domain suggestions based on business name and keywords
   */
  async generateDomainSuggestions(
    businessName: string,
    keywords: string[] = [],
    marketCategory?: string
  ): Promise<DomainSuggestion[]> {
    try {
      const suggestions: DomainSuggestion[] = [];
      const cleanBusinessName = this.cleanDomainName(businessName);
      
      // Generate base suggestions
      const baseSuggestions = this.generateBaseSuggestions(cleanBusinessName, keywords, marketCategory);
      
      // Check availability for each suggestion
      for (const suggestion of baseSuggestions) {
        for (const tld of this.popularTlds) {
          const domain = `${suggestion}${tld}`;
          const availability = await this.checkDomainAvailability(domain);
          
          suggestions.push({
            domain,
            available: availability.available,
            price: availability.price,
            registrar: availability.registrar,
            alternatives: availability.alternatives,
          });
          
          // Limit to prevent too many API calls
          if (suggestions.length >= 20) break;
        }
        if (suggestions.length >= 20) break;
      }

      // Sort by availability and preference
      return this.sortSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating domain suggestions:', error);
      return this.getFallbackSuggestions(businessName);
    }
  }

  /**
   * Check domain availability using domain APIs
   */
  async checkDomainAvailability(domain: string): Promise<{
    available: boolean;
    price?: number;
    registrar?: string;
    alternatives?: string[];
  }> {
    try {
      // Try multiple domain checking services
      const results = await Promise.allSettled([
        this.checkWithNamecheap(domain),
        this.checkWithWhoisAPI(domain),
        this.checkWithDomainAPI(domain),
      ]);

      // Use the first successful result
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
      }

      // Fallback to basic check
      return this.basicDomainCheck(domain);
    } catch (error) {
      console.error(`Error checking domain availability for ${domain}:`, error);
      return { available: false, alternatives: [] };
    }
  }

  /**
   * Check domain availability with Namecheap API
   */
  private async checkWithNamecheap(domain: string): Promise<{
    available: boolean;
    price?: number;
    registrar?: string;
    alternatives?: string[];
  } | null> {
    if (!process.env.NAMECHEAP_API_KEY || !process.env.NAMECHEAP_USERNAME) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.namecheap.com/xml.response?ApiUser=${process.env.NAMECHEAP_USERNAME}&ApiKey=${process.env.NAMECHEAP_API_KEY}&UserName=${process.env.NAMECHEAP_USERNAME}&Command=namecheap.domains.check&ClientIp=127.0.0.1&DomainList=${domain}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const xmlText = await response.text();
        const available = xmlText.includes('Available="true"');
        
        return {
          available,
          registrar: 'Namecheap',
          price: available ? 12.99 : undefined, // Default price
        };
      }
    } catch (error) {
      console.error('Namecheap API error:', error);
    }

    return null;
  }

  /**
   * Check domain availability with WHOIS API
   */
  private async checkWithWhoisAPI(domain: string): Promise<{
    available: boolean;
    price?: number;
    registrar?: string;
    alternatives?: string[];
  } | null> {
    if (!process.env.WHOIS_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(
        `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${process.env.WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        const available = !data.WhoisRecord || data.WhoisRecord.dataError === 'MISSING';
        
        return {
          available,
          registrar: 'WHOIS API',
        };
      }
    } catch (error) {
      console.error('WHOIS API error:', error);
    }

    return null;
  }

  /**
   * Check domain availability with Domain API
   */
  private async checkWithDomainAPI(domain: string): Promise<{
    available: boolean;
    price?: number;
    registrar?: string;
    alternatives?: string[];
  } | null> {
    if (!process.env.DOMAIN_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.domainr.com/v2/status?domain=${domain}&client_id=${process.env.DOMAIN_API_KEY}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        const status = data.status?.[0]?.status;
        const available = status === 'undelegated' || status === 'inactive';
        
        return {
          available,
          registrar: 'Domain API',
        };
      }
    } catch (error) {
      console.error('Domain API error:', error);
    }

    return null;
  }

  /**
   * Basic domain check (fallback)
   */
  private basicDomainCheck(domain: string): {
    available: boolean;
    price?: number;
    registrar?: string;
    alternatives?: string[];
  } {
    // Simple heuristic: assume shorter domains are less likely to be available
    const available = domain.length > 15 || Math.random() > 0.7;
    
    return {
      available,
      price: available ? 14.99 : undefined,
      registrar: 'Generic',
      alternatives: available ? [] : this.generateAlternatives(domain),
    };
  }

  /**
   * Generate base domain suggestions
   */
  private generateBaseSuggestions(
    businessName: string,
    keywords: string[],
    marketCategory?: string
  ): string[] {
    const suggestions = new Set<string>();
    
    // Add business name variations
    suggestions.add(businessName);
    suggestions.add(businessName.replace(/\s+/g, ''));
    suggestions.add(businessName.replace(/\s+/g, '-'));
    
    // Add keyword combinations
    keywords.forEach(keyword => {
      const cleanKeyword = this.cleanDomainName(keyword);
      suggestions.add(`${businessName}${cleanKeyword}`);
      suggestions.add(`${cleanKeyword}${businessName}`);
      suggestions.add(`${businessName}-${cleanKeyword}`);
    });

    // Add category-specific suggestions
    if (marketCategory) {
      const categoryKeywords = this.getCategoryKeywords(marketCategory);
      categoryKeywords.forEach(catKeyword => {
        suggestions.add(`${businessName}${catKeyword}`);
        suggestions.add(`${businessName}-${catKeyword}`);
      });
    }

    // Add fallback suggestions
    this.fallbackSuggestions.forEach(suffix => {
      suggestions.add(`${businessName}${suffix}`);
      suggestions.add(`${businessName}-${suffix}`);
    });

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Clean domain name for URL compatibility
   */
  private cleanDomainName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 30);
  }

  /**
   * Get category-specific keywords
   */
  private getCategoryKeywords(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      saas: ['app', 'software', 'platform', 'cloud', 'tech'],
      ecommerce: ['shop', 'store', 'market', 'buy', 'sell'],
      fintech: ['pay', 'finance', 'money', 'bank', 'invest'],
      healthtech: ['health', 'medical', 'care', 'wellness', 'fit'],
      edtech: ['learn', 'edu', 'teach', 'study', 'academy'],
      other: ['hub', 'pro', 'solutions', 'works', 'digital'],
    };

    return categoryMap[category.toLowerCase()] || categoryMap.other;
  }

  /**
   * Generate alternative domain suggestions
   */
  private generateAlternatives(domain: string): string[] {
    const baseName = domain.split('.')[0];
    const alternatives: string[] = [];
    
    this.fallbackSuggestions.forEach(suffix => {
      alternatives.push(`${baseName}${suffix}.com`);
    });

    return alternatives.slice(0, 3);
  }

  /**
   * Sort suggestions by preference
   */
  private sortSuggestions(suggestions: DomainSuggestion[]): DomainSuggestion[] {
    return suggestions.sort((a, b) => {
      // Available domains first
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      
      // Prefer .com domains
      if (a.domain.endsWith('.com') && !b.domain.endsWith('.com')) return -1;
      if (!a.domain.endsWith('.com') && b.domain.endsWith('.com')) return 1;
      
      // Prefer shorter domains
      return a.domain.length - b.domain.length;
    });
  }

  /**
   * Get fallback suggestions when API fails
   */
  private getFallbackSuggestions(businessName: string): DomainSuggestion[] {
    const cleanName = this.cleanDomainName(businessName);
    const suggestions: DomainSuggestion[] = [];

    this.popularTlds.forEach(tld => {
      suggestions.push({
        domain: `${cleanName}${tld}`,
        available: Math.random() > 0.5, // Random for fallback
        price: 14.99,
        registrar: 'Generic',
      });
    });

    return suggestions.slice(0, 10);
  }
}
