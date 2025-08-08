'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { IdeaCard } from '@/components/IdeaCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { LeaderboardEntry } from '@/lib/types';

export default function Home() {
  const [bestIdea, setBestIdea] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestOfDay = async () => {
      try {
        const response = await fetch('/api/best-of-day');
        const data = await response.json();
        setBestIdea(data.bestIdea);
      } catch {
        // Silently fail for best-of-day - non-critical feature
      } finally {
        setLoading(false);
      }
    };

    fetchBestOfDay();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">
            Validate Your Startup Ideas
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get AI-powered market analysis, competition insights, and validation scores for your startup ideas in minutes.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/submit">
              <Button size="lg">
                Submit Your Idea
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" size="lg">
                View Leaderboard
              </Button>
            </Link>
          </div>
        </section>

        {/* Best Idea of the Day */}
        <section className="py-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            💡 Best Idea of the Day
          </h2>
          
          {loading ? (
            <div className="max-w-2xl mx-auto">
              <div className="border rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ) : bestIdea ? (
            <div className="max-w-2xl mx-auto">
              <IdeaCard idea={bestIdea} />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-muted-foreground">
                No ideas have been scored today yet. Be the first!
              </p>
              <Link href="/submit" className="inline-block mt-4">
                <Button>Submit the First Idea</Button>
              </Link>
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="py-12 bg-muted/30 rounded-lg mt-12">
          <div className="px-6">
            <h2 className="text-2xl font-bold text-center mb-8">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Submit Your Idea</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your startup idea in a few sentences. What problem does it solve?
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes market size, competition, risks, and monetization opportunities.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Get Your Score</h3>
                <p className="text-sm text-muted-foreground">
                  Receive a validation score (0-100) with detailed insights and recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
