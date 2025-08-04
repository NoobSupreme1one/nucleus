import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/types";
import LeaderboardCard from "@/components/LeaderboardCard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState } from "react";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: leaderboard = [] } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const topUsers = leaderboard.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center" aria-hidden="true">
                <i className="fas fa-handshake text-white text-sm" aria-hidden="true"></i>
              </div>
              <span className="text-xl font-bold text-foreground">Nucleus</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1">How It Works</a>
              <a href="#leaderboard" className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1">Leaderboard</a>
              <a href="/pricing" className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1">Pricing</a>
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => window.location.href = '/login'}
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
              <Button
                className="gradient-primary hover:shadow-lg transition-all"
                onClick={() => window.location.href = '/login'}
                aria-label="Get started with Nucleus"
              >
                Get Started
              </Button>
            </div>

            <Button
              variant="ghost"
              className="md:hidden min-h-[44px] min-w-[44px] p-3"
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-muted-foreground text-lg`} aria-hidden="true"></i>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-t border-border shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <a
                href="#features"
                className="block py-3 px-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block py-3 px-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#leaderboard"
                className="block py-3 px-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Leaderboard
              </a>
              <a
                href="/pricing"
                className="block py-3 px-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="pt-4 space-y-3">
                <div className="flex justify-center py-2">
                  <ThemeToggle />
                </div>
                <Button
                  variant="outline"
                  className="w-full min-h-[44px] text-base"
                  onClick={() => window.location.href = '/login'}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full gradient-primary min-h-[44px] text-base"
                  onClick={() => window.location.href = '/login'}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main id="main-content">
        <section className="bg-background" aria-labelledby="hero-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center fade-in-up">
              <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Validate Your Startup Idea{" "}
                <span className="gradient-text">Before You Build</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
                Get AI-powered analysis with a 1,000-point scoring system, then find the perfect co-founder to bring your validated idea to life.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 min-h-[24px]">
                  <i className="fas fa-check-circle text-green-500 text-base" aria-hidden="true"></i>
                  <span className="font-medium">Free idea validation</span>
                </div>
                <div className="flex items-center gap-2 min-h-[24px]">
                  <i className="fas fa-check-circle text-green-500 text-base" aria-hidden="true"></i>
                  <span className="font-medium">AI-powered insights</span>
                </div>
                <div className="flex items-center gap-2 min-h-[24px]">
                  <i className="fas fa-check-circle text-green-500 text-base" aria-hidden="true"></i>
                  <span className="font-medium">Co-founder matching</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0 fade-in-up" style={{animationDelay: '0.3s'}}>
                <Button
                  size="lg"
                  className="gradient-primary hover:shadow-xl transition-all text-base sm:text-lg px-6 sm:px-8 py-4 min-h-[48px] w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 btn-hover-scale group"
                  onClick={() => window.location.href = '/login'}
                  aria-label="Validate your startup idea for free"
                >
                  Validate My Idea Free
                  <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true"></i>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-6 sm:px-8 py-4 min-h-[48px] w-full sm:w-auto hover:border-primary hover:text-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 btn-hover-scale group"
                  onClick={() => window.location.href = '/demo'}
                  aria-label="Try our interactive demo"
                >
                  <i className="fas fa-play mr-2 group-hover:scale-110 transition-transform" aria-hidden="true"></i>
                  Try Demo
                </Button>
              </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 sm:px-0 fade-in-up" style={{animationDelay: '0.5s'}} role="list">
              <div className="text-center py-6 hover-lift" role="listitem">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 float" style={{animationDelay: '0.5s'}} aria-hidden="true">
                  <i className="fas fa-lightbulb text-white text-2xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Validate Ideas</h3>
                <p className="text-muted-foreground leading-relaxed">AI-powered analysis with 1,000-point scoring system</p>
              </div>
              <div className="text-center py-6 hover-lift" role="listitem">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 float" style={{animationDelay: '1s'}} aria-hidden="true">
                  <i className="fas fa-users text-white text-2xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Match Co-Founders</h3>
                <p className="text-muted-foreground leading-relaxed">Swipe through complementary skill sets and personalities</p>
              </div>
              <div className="text-center py-6 hover-lift" role="listitem">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 float" style={{animationDelay: '1.5s'}} aria-hidden="true">
                  <i className="fas fa-rocket text-white text-2xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Build Startups</h3>
                <p className="text-muted-foreground leading-relaxed">Turn validated ideas into successful companies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-background" aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Trusted by Entrepreneurs Worldwide
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Join thousands of founders who have validated their ideas and found co-founders through Nucleus.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Testimonial 1 */}
              <div className="bg-muted rounded-lg p-8 relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Sarah Chen</h4>
                    <p className="text-sm text-gray-600">CEO, TechFlow AI</p>
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-4">
                  "Nucleus helped me validate my AI startup idea and connected me with my technical co-founder.
                  We raised $2M in seed funding within 6 months!"
                </blockquote>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <span className="ml-2 text-gray-600 text-sm">5.0</span>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-muted rounded-lg p-8 relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    M
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Marcus Rodriguez</h4>
                    <p className="text-sm text-gray-600">Founder, EcoLogistics</p>
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-4">
                  "The AI analysis saved me months of market research. The 847/1000 score gave me confidence
                  to pursue my logistics startup. Now we're profitable!"
                </blockquote>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <span className="ml-2 text-gray-600 text-sm">5.0</span>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-muted rounded-lg p-8 relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    A
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Aisha Patel</h4>
                    <p className="text-sm text-gray-600">Co-founder, HealthTech Solutions</p>
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-4">
                  "Found my perfect co-founder through Nucleus! The proof-of-work approach meant I could see
                  real skills, not just resumes. We're now building the future of healthcare."
                </blockquote>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <i className="fas fa-star" aria-hidden="true"></i>
                  <span className="ml-2 text-gray-600 text-sm">5.0</span>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-gray-600">Ideas Validated</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">5,000+</div>
                <div className="text-gray-600">Co-founder Matches</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">$50M+</div>
                <div className="text-gray-600">Funding Raised</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">98%</div>
                <div className="text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section id="leaderboard" className="py-20 bg-muted/50" aria-labelledby="leaderboard-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="leaderboard-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">Top Innovators</h2>
              <p className="text-xl text-muted-foreground">See who's leading with the highest-scoring startup ideas</p>
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
                  onClick={() => window.location.href = '/login'}
                >
                  View Full Leaderboard (Top 100) <i className="fas fa-arrow-right ml-1"></i>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to validate your startup idea and find the perfect co-founder.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-gray-50" aria-labelledby="how-it-works-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Nucleus Works</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our unique proof-of-work approach ensures you find co-founders based on demonstrated skills, not just credentials.
              </p>
            </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" role="list">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow" role="listitem">
              <CardContent className="pt-6">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                  <i className="fas fa-clipboard-check text-white text-3xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Validate Your Idea</h3>
                <p className="text-gray-600 leading-relaxed">
                  Submit your startup idea and get comprehensive AI-powered analysis with market insights,
                  technical feasibility assessment, and a score out of 1,000 points.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow" role="listitem">
              <CardContent className="pt-6">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                  <i className="fas fa-briefcase text-white text-3xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Create Your Portfolio</h3>
                <p className="text-gray-600 leading-relaxed">
                  Showcase your skills with role-specific submissions. Engineers share code,
                  designers show mockups, and marketers present campaigns.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow" role="listitem">
              <CardContent className="pt-6">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                  <i className="fas fa-heart text-white text-3xl" aria-hidden="true"></i>
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

        {/* Team Section */}
        <section className="py-20 bg-white" aria-labelledby="team-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="team-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Built by Entrepreneurs, for Entrepreneurs
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our team has been through the startup journey multiple times. We know the challenges you face.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Team Member 1 */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                  A
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Alex Chen</h3>
                <p className="text-primary font-medium mb-2">Co-founder & CEO</p>
                <p className="text-gray-600 text-sm mb-4">
                  Former Y Combinator founder with 2 successful exits. Built and sold SaaS companies to Fortune 500.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="https://linkedin.com/in/alexchen" className="text-gray-400 hover:text-primary transition-colors">
                    <i className="fab fa-linkedin" aria-hidden="true"></i>
                  </a>
                  <a href="https://twitter.com/alexchen" className="text-gray-400 hover:text-primary transition-colors">
                    <i className="fab fa-twitter" aria-hidden="true"></i>
                  </a>
                </div>
              </div>

              {/* Team Member 2 */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                  S
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sarah Kim</h3>
                <p className="text-primary font-medium mb-2">Co-founder & CTO</p>
                <p className="text-gray-600 text-sm mb-4">
                  Ex-Google AI researcher with 10+ years in machine learning. PhD in Computer Science from Stanford.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="https://linkedin.com/in/sarahkim" className="text-gray-400 hover:text-primary transition-colors">
                    <i className="fab fa-linkedin" aria-hidden="true"></i>
                  </a>
                  <a href="https://github.com/sarahkim" className="text-gray-400 hover:text-primary transition-colors">
                    <i className="fab fa-github" aria-hidden="true"></i>
                  </a>
                </div>
              </div>

              {/* Team Member 3 */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                  M
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Marcus Johnson</h3>
                <p className="text-primary font-medium mb-2">Head of Growth</p>
                <p className="text-gray-600 text-sm mb-4">
                  Former VP of Growth at Stripe. Scaled multiple startups from 0 to $100M+ ARR. Expert in product-led growth.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="https://linkedin.com/in/marcusjohnson" className="text-gray-400 hover:text-primary transition-colors">
                    <i className="fab fa-linkedin" aria-hidden="true"></i>
                  </a>
                  <a href="https://twitter.com/marcusjohnson" className="text-gray-400 hover:text-primary transition-colors">
                    <i className="fab fa-twitter" aria-hidden="true"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Company Stats */}
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Track Record</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">5</div>
                  <div className="text-gray-600 text-sm">Successful Exits</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">$500M+</div>
                  <div className="text-gray-600 text-sm">Combined Exit Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">15+</div>
                  <div className="text-gray-600 text-sm">Years Experience</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">100+</div>
                  <div className="text-gray-600 text-sm">Startups Advised</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 gradient-primary" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Ready to Find Your Co-Founder?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of entrepreneurs who are validating ideas and building teams on Nucleus.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-base sm:text-lg px-6 sm:px-8 py-4 min-h-[48px] bg-white text-primary hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary w-full sm:w-auto max-w-sm"
              onClick={() => window.location.href = '/login'}
              aria-label="Get started with Nucleus for free"
            >
              Get Started Free <i className="fas fa-arrow-right ml-2" aria-hidden="true"></i>
            </Button>
        </div>
      </section>

        {/* Footer with Trust Signals */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Security Badges */}
            <div className="text-center mb-12">
              <h3 className="text-xl font-semibold mb-6">Trusted & Secure</h3>
              <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
                {/* Security Badge 1 */}
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg">
                  <i className="fas fa-shield-alt text-green-400 text-xl" aria-hidden="true"></i>
                  <div className="text-left">
                    <div className="font-semibold text-sm">SSL Encrypted</div>
                    <div className="text-xs text-gray-400">256-bit Security</div>
                  </div>
                </div>

                {/* Security Badge 2 */}
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg">
                  <i className="fas fa-lock text-blue-400 text-xl" aria-hidden="true"></i>
                  <div className="text-left">
                    <div className="font-semibold text-sm">GDPR Compliant</div>
                    <div className="text-xs text-gray-400">Data Protected</div>
                  </div>
                </div>

                {/* Security Badge 3 */}
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg">
                  <i className="fas fa-user-shield text-purple-400 text-xl" aria-hidden="true"></i>
                  <div className="text-left">
                    <div className="font-semibold text-sm">SOC 2 Type II</div>
                    <div className="text-xs text-gray-400">Audited Security</div>
                  </div>
                </div>

                {/* Security Badge 4 */}
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg">
                  <i className="fas fa-credit-card text-yellow-400 text-xl" aria-hidden="true"></i>
                  <div className="text-left">
                    <div className="font-semibold text-sm">PCI Compliant</div>
                    <div className="text-xs text-gray-400">Secure Payments</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                    <i className="fas fa-handshake text-white text-sm" aria-hidden="true"></i>
                  </div>
                  <span className="text-xl font-bold">Nucleus</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The trusted platform for startup idea validation and co-founder matching.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#leaderboard" className="hover:text-white transition-colors">Leaderboard</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="/team" className="hover:text-white transition-colors">Our Team</a></li>
                  <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="/security" className="hover:text-white transition-colors">Security</a></li>
                  <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-400 mb-4 md:mb-0">
                © 2024 Nucleus. All rights reserved. Built with ❤️ for entrepreneurs.
              </div>
              <div className="flex items-center space-x-6">
                <a href="https://twitter.com/nucleus" className="text-gray-400 hover:text-white transition-colors" aria-label="Follow us on Twitter">
                  <i className="fab fa-twitter text-lg" aria-hidden="true"></i>
                </a>
                <a href="https://linkedin.com/company/nucleus" className="text-gray-400 hover:text-white transition-colors" aria-label="Connect on LinkedIn">
                  <i className="fab fa-linkedin text-lg" aria-hidden="true"></i>
                </a>
                <a href="https://github.com/nucleus" className="text-gray-400 hover:text-white transition-colors" aria-label="View our GitHub">
                  <i className="fab fa-github text-lg" aria-hidden="true"></i>
                </a>
                <a href="mailto:hello@nucleus.com" className="text-gray-400 hover:text-white transition-colors" aria-label="Email us">
                  <i className="fas fa-envelope text-lg" aria-hidden="true"></i>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
