import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import avatar1 from "@/assets/avatars/user1.svg";
import avatar2 from "@/assets/avatars/user2.svg";
import avatar3 from "@/assets/avatars/user3.svg";
import avatar4 from "@/assets/avatars/user4.svg";
import avatar5 from "@/assets/avatars/user5.svg";
import avatar6 from "@/assets/avatars/user6.svg";
import MealPlanner from "@mockup/ai_meal_planner_landing_page_react_tailwind";
import Sustainable from "@mockup/sustainable_packaging_marketplace_landing_page_react_tailwind";
import RemoteEnergyDual from "@mockup/dual_landing_pages_remote_collaboration_smart_energy";
import Energy from "@mockup/smart_home_energy_optimizer_landing_page_react_tailwind_shadcn_ui";
import TeenMental from "@mockup/landing_page_teen_mental_health_chatbot";
import BlockchainVoting from "@mockup/blockchain_voting_landing_page_react_tailwind";

function ScaledPreview({ children }: { children: React.ReactNode }) {
  // Render a scaled-down preview of a full-page component
  const scale = 0.25; // 1280x800 scaled to ~320x200
  const width = 1280;
  const height = 800;
  return (
    <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-white" style={{ height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

function MockPreview({ slug }: { slug: string }) {
  switch (slug) {
    case 'ai-meal-planner':
      return <ScaledPreview><MealPlanner /></ScaledPreview>;
    case 'sustainable-packaging':
      return <ScaledPreview><Sustainable /></ScaledPreview>;
    case 'remote-collab':
      return <ScaledPreview><RemoteEnergyDual /></ScaledPreview>;
    case 'smart-energy':
      return <ScaledPreview><Energy /></ScaledPreview>;
    case 'teen-mental-health':
      return <ScaledPreview><TeenMental /></ScaledPreview>;
    case 'blockchain-voting':
      return <ScaledPreview><BlockchainVoting /></ScaledPreview>;
    default:
      return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-32 flex items-center justify-center border border-gray-200">
          <div className="text-center">
            <i className="fas fa-laptop text-gray-400 text-2xl mb-2"></i>
            <p className="text-gray-500 text-sm">Landing Page Preview</p>
          </div>
        </div>
      );
  }
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ideaInput, setIdeaInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();
  
  // Fetch community feed data
  const { data: communityData = [], refetch: refetchCommunity, isLoading } = useQuery({
    queryKey: ['/api/community-ideas'],
    queryFn: async () => {
      // For now, return sample data - in real app this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return communityShowcase;
    },
    staleTime: 30000, // 30 seconds
  });
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCommunity();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetchCommunity]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchCommunity();
    setRefreshing(false);
  };

  // Sample user ideas history - in real app this would come from API
  const userIdeas = [
    {
      id: 1,
      idea: "AI-powered meal planning app with nutrition tracking",
      score: 847,
      createdAt: "2024-08-08",
      status: "validated"
    },
    {
      id: 2,
      idea: "Blockchain-based carbon credit marketplace",
      score: 692,
      createdAt: "2024-08-07",
      status: "validated"
    },
    {
      id: 3,
      idea: "Remote team productivity dashboard",
      score: 758,
      createdAt: "2024-08-06",
      status: "validated"
    }
  ];

  // Sample community data - in real app this would come from API
  const communityShowcase = [
    {
      id: 1,
      idea: "AI-powered meal planning app",
      score: 847,
      user: { 
        name: "Sarah Chen", 
        handle: "@sarahc",
        title: "Product Designer",
        location: "San Francisco, CA",
        avatarUrl: avatar1
      },
      gradient: "from-blue-500 to-purple-600",
      slug: "ai-meal-planner",
    },
    {
      id: 2,
      idea: "Sustainable packaging marketplace",
      score: 923,
      user: { 
        name: "Marcus Rodriguez", 
        handle: "@marcusrod",
        title: "Sustainability Analyst",
        location: "Austin, TX",
        avatarUrl: avatar2
      },
      gradient: "from-green-500 to-blue-600",
      slug: "sustainable-packaging",
    },
    {
      id: 3,
      idea: "Remote team collaboration platform",
      score: 768,
      user: { 
        name: "Aisha Patel", 
        handle: "@aishap",
        title: "Founder, OrbitCollab",
        location: "Toronto, ON",
        avatarUrl: avatar3
      },
      gradient: "from-purple-500 to-pink-600",
      slug: "remote-collab",
    },
    {
      id: 4,
      idea: "Smart home energy optimizer",
      score: 892,
      user: { 
        name: "David Kim", 
        handle: "@davkim",
        title: "Energy Systems Eng",
        location: "Seattle, WA",
        avatarUrl: avatar4
      },
      gradient: "from-orange-500 to-red-600",
      slug: "smart-energy",
    },
    {
      id: 5,
      idea: "Mental health chatbot for teens",
      score: 715,
      user: { 
        name: "Emma Thompson", 
        handle: "@emma_t",
        title: "Youth Counselor",
        location: "London, UK",
        avatarUrl: avatar5
      },
      gradient: "from-teal-500 to-cyan-600",
      slug: "teen-mental-health",
    },
    {
      id: 6,
      idea: "Blockchain-based voting system",
      score: 683,
      user: { 
        name: "James Wilson", 
        handle: "@jameswil",
        title: "Civic Tech Lead",
        location: "Boston, MA",
        avatarUrl: avatar6
      },
      gradient: "from-indigo-500 to-purple-600",
      slug: "blockchain-voting",
    }
  ];

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
            <div className="flex items-center space-x-3">
              {/* FoundrCheck Logo */}
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-2xl font-bold text-foreground tracking-tight">FoundrCheck</span>
            </div>
            
            {/* Center - Empty for now */}
            <div className="flex-1"></div>
            
            {/* Right side - Auth buttons or user menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setSidebarOpen(true)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    My Ideas
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => (window.location.href = '/profile')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    Profile
                  </Button>
                  <div className="flex items-center space-x-3">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Me"
                        className="w-8 h-8 rounded-full object-cover border"
                        onClick={() => (window.location.href = '/profile')}
                        title="Edit profile"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {(user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U')}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      onClick={logout}
                      className="text-muted-foreground hover:text-primary"
                    >
                      Log Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = '/profile'}
                    aria-label="Go to profile"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = '/login'}
                    aria-label="Log in to your account"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Log In
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                    onClick={() => window.location.href = '/login'}
                    aria-label="Get started with FoundrCheck"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
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
            <div className="px-4 py-4 space-y-3">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full min-h-[44px] text-base text-muted-foreground hover:text-primary justify-start"
                    onClick={() => {
                      setSidebarOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    My Ideas
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full min-h-[44px] text-base text-muted-foreground hover:text-primary justify-start"
                    onClick={() => {
                      window.location.href = '/profile';
                      setMobileMenuOpen(false);
                    }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full min-h-[44px] text-base text-muted-foreground hover:text-primary justify-start"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full min-h-[44px] text-base text-muted-foreground hover:text-primary justify-start"
                    onClick={() => {
                      window.location.href = '/profile';
                      setMobileMenuOpen(false);
                    }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full min-h-[44px] text-base text-muted-foreground hover:text-primary justify-start"
                    onClick={() => {
                      window.location.href = '/login';
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-h-[44px] text-base"
                    onClick={() => {
                      window.location.href = '/login';
                      setMobileMenuOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main id="main-content">
        <section className="bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 min-h-screen flex items-center" aria-labelledby="hero-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Validate your startup idea{" "}
              <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">✨ before you build</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Get AI-powered analysis with a 100-point scoring system. Join thousands of entrepreneurs who've validated their ideas.
            </p>
            
            {/* Single Input Field */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative bg-gray-800 rounded-2xl p-1 shadow-2xl">
                <div className="flex items-center bg-gray-900 rounded-xl px-4 py-3">
                  <i className="fas fa-lightbulb text-yellow-400 text-lg mr-3" aria-hidden="true"></i>
                  <input
                    type="text"
                    placeholder="Describe your startup idea..."
                    value={ideaInput}
                    onChange={(e) => setIdeaInput(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-gray-400 text-lg focus:outline-none"
                  />
                  <Button
                    className="ml-3 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-semibold px-6 py-2 rounded-lg transition-all"
                    onClick={() => {
                      if (!user) {
                        window.location.href = '/login';
                      } else {
                        // TODO: Handle idea validation
                        console.log('Validating idea:', ideaInput);
                      }
                    }}
                  >
                    Validate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Showcase Section */}
        <section className="py-20 bg-gray-100" aria-labelledby="community-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <h2 id="community-heading" className="text-3xl md:text-4xl font-bold text-gray-900">
                  From the Community
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 hover:bg-gray-100"
                >
                  <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''} text-gray-600`} />
                </Button>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See what entrepreneurs are building with validated ideas • Updates in real-time
              </p>
            </div>
            
            {/* Community Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            <div className="h-4 bg-gray-300 rounded w-20"></div>
                          </div>
                          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                        <div className="h-32 bg-gray-300 rounded-lg"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                communityData.map((item) => (
                <Card key={item.id} className="bg-white hover:shadow-lg transition-all duration-300 border border-gray-200">
                  <CardContent className="p-6">
                    {/* Header with Profile and Score */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={item.user.avatarUrl} 
                          alt={`${item.user.name} avatar`} 
                          className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                          loading="lazy"
                        />
                        <div className="leading-tight">
                          <h4 className="font-medium text-gray-900 text-sm">{item.user.name}</h4>
                          <div className="text-xs text-gray-500">{item.user.handle}</div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[140px]" title={`${item.user.title} • ${item.user.location}`}>
                            {item.user.title} • {item.user.location}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {(item.score / 10).toFixed(1)}
                      </div>
                    </div>
                    
                    {/* Idea Subtitle */}
                    <p className="text-gray-700 font-medium mb-4 leading-relaxed">
                      {item.idea}
                    </p>
                    
                    {/* Embedded Landing Preview with link overlay */}
                    <div className="relative">
                      <MockPreview slug={item.slug} />
                      <Link href={`/mock/${item.slug}`}>
                        <a className="absolute top-2 right-2 inline-flex items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-200 shadow hover:bg-white">
                          Open <i className="fas fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>
        </section>


        {/* Simple Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xl font-bold">FoundrCheck</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Validate your startup ideas with AI-powered insights and scoring.
              </p>
              <div className="text-xs text-gray-500">
                © 2024 FoundrCheck. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
        
        {/* User Ideas Sidebar */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">My Ideas</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2"
                  >
                    <i className="fas fa-times text-gray-500" />
                  </Button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {user && userIdeas.length > 0 ? (
                    <div className="space-y-4">
                      {userIdeas.map((idea) => (
                        <Card key={idea.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                  {idea.idea}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(idea.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="ml-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {idea.score}/100
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                idea.status === 'validated' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {idea.status === 'validated' ? '✓ Validated' : 'Pending'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-lightbulb text-gray-400 text-2xl" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas yet</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Start by validating your first startup idea!
                      </p>
                      <Button
                        onClick={() => setSidebarOpen(false)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
