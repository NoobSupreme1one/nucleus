import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { User } from "@shared/types";
import LeaderboardCard from "@/components/LeaderboardCard";

export default function Landing() {
  const { data: leaderboard = [] } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const topUsers = leaderboard.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-handshake text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">FounderMatch</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors">How It Works</a>
              <a href="#leaderboard" className="text-gray-600 hover:text-primary transition-colors">Leaderboard</a>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/api/login'}
              >
                Sign In
              </Button>
              <Button 
                className="gradient-primary hover:shadow-lg transition-all"
                onClick={() => window.location.href = '/api/login'}
              >
                Get Started
              </Button>
            </div>

            <Button variant="ghost" className="md:hidden p-2">
              <i className="fas fa-bars text-gray-600"></i>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect{" "}
              <span className="gradient-text">Co-Founder</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Validate your startup ideas and match with complementary co-founders through our proof-of-work platform. Show your skills, not just your resume.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="gradient-primary hover:shadow-xl transition-all text-lg px-8 py-4"
                onClick={() => window.location.href = '/api/login'}
              >
                Start Matching Today
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="text-lg px-8 py-4 hover:border-primary hover:text-primary transition-all"
                onClick={() => window.location.href = '/api/login'}
              >
                Validate Your Idea
              </Button>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-lightbulb text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Validate Ideas</h3>
                <p className="text-gray-600">AI-powered analysis with 1,000-point scoring system</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Match Co-Founders</h3>
                <p className="text-gray-600">Swipe through complementary skill sets and personalities</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-rocket text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Startups</h3>
                <p className="text-gray-600">Turn validated ideas into successful companies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section id="leaderboard" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Top Innovators</h2>
            <p className="text-xl text-gray-600">See who's leading with the highest-scoring startup ideas</p>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Leaderboard</h3>
                <span className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Top 10</span>
              </div>
              
              {topUsers.length > 0 ? (
                <div className="space-y-4">
                  {topUsers.map((user, index) => (
                    <LeaderboardCard 
                      key={user.id} 
                      user={user} 
                      rank={index + 1} 
                      isTopThree={index < 3}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-trophy text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-500 text-lg">No leaderboard data available yet</p>
                  <p className="text-gray-400 text-sm">Be the first to validate your startup idea!</p>
                </div>
              )}
              
              <div className="text-center mt-8">
                <Button 
                  variant="link" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => window.location.href = '/api/login'}
                >
                  View Full Leaderboard (Top 100) <i className="fas fa-arrow-right ml-1"></i>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How FounderMatch Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our unique proof-of-work approach ensures you find co-founders based on demonstrated skills, not just credentials.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-clipboard-check text-white text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Validate Your Idea</h3>
                <p className="text-gray-600 leading-relaxed">
                  Submit your startup idea and get comprehensive AI-powered analysis with market insights, 
                  technical feasibility assessment, and a score out of 1,000 points.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-briefcase text-white text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Create Your Portfolio</h3>
                <p className="text-gray-600 leading-relaxed">
                  Showcase your skills with role-specific submissions. Engineers share code, 
                  designers show mockups, and marketers present campaigns.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-heart text-white text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Match & Connect</h3>
                <p className="text-gray-600 leading-relaxed">
                  Swipe through potential co-founders with complementary skills. 
                  When you both swipe right, start building together!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Find Your Co-Founder?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who are validating ideas and building teams on FounderMatch.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-4 bg-white text-primary hover:bg-gray-50 transition-all"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started Free <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </div>
      </section>
    </div>
  );
}
