import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeaderboardCard from "@/components/LeaderboardCard";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, Match, Idea } from "@shared/types";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check for auth success query parameter
  const isAuthCallback = window.location.search.includes('auth=success');

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthCallback) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, isAuthCallback]);

  const { data: matches = [], isLoading: matchesLoading } = useQuery<(Match & { user1: User; user2: User })[]>({
    queryKey: ["/api/matches"],
    enabled: !!user,
  });

  const { data: leaderboard = [] } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: ideas = [] } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
    enabled: !!user,
  });

  if (isLoading || (!user && !isAuthCallback)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-handshake text-white text-2xl"></i>
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email?.split('@')[0] || 'User';

  const mutualMatches = matches.filter((match: any) => match.status === 'mutual');
  const userRank = leaderboard.findIndex((u: any) => u.id === user.id) + 1;
  const topLeaderboard = leaderboard.slice(0, 3);
  const highestIdeaScore = Math.max(...ideas.map((idea: any) => idea.validationScore || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-handshake text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-foreground">Nucleus</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/leaderboard">
                  <i className="fas fa-trophy mr-1"></i>
                  Leaderboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">
                  <i className="fas fa-crown mr-1"></i>
                  Pricing
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/api/auth/logout'}
              >
                <i className="fas fa-sign-out-alt mr-1"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-muted-foreground text-2xl"></i>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Welcome back, {displayName.split(' ')[0]}!</h1>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    {user.role && <span className="capitalize">{user.role}</span>}
                    {user.location && (
                      <>
                        {user.role && <span>•</span>}
                        <span>{user.location}</span>
                      </>
                    )}
                    <span>•</span>
                    <Badge variant="secondary" className="gradient-primary text-white">
                      {user.subscriptionTier === 'pro' ? 'Pro Member' : 'Free Member'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.totalIdeaScore || 0}</div>
                  <div className="text-sm text-muted-foreground">Idea Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mutualMatches.length}</div>
                  <div className="text-sm text-muted-foreground">Matches</div>
                </div>
                {userRank > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">#{userRank}</div>
                    <div className="text-sm text-muted-foreground">Rank</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Actions and Matches */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button asChild className="gradient-primary h-auto px-4 py-3 flex-col space-y-1">
                    <Link href="/matching">
                      <i className="fas fa-heart text-xl"></i>
                      <div className="font-semibold text-sm">Start Matching</div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto px-4 py-3 flex-col space-y-1">
                    <Link href="/validate-idea">
                      <i className="fas fa-lightbulb text-xl text-blue-600"></i>
                      <div className="font-semibold text-sm">Validate Idea</div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto px-4 py-3 flex-col space-y-1">
                    <Link href="/portfolio">
                      <i className="fas fa-briefcase text-xl text-green-600"></i>
                      <div className="font-semibold text-sm">Update Portfolio</div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Matches */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Matches</CardTitle>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/matches">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-muted rounded-xl animate-pulse">
                        <div className="w-12 h-12 bg-muted-foreground/20 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-1/3"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.slice(0, 3).map((match: any) => {
                      const otherUser = match.user1Id === user.id ? match.user2 : match.user1;
                      const otherUserName = otherUser?.firstName && otherUser?.lastName 
                        ? `${otherUser.firstName} ${otherUser.lastName}` 
                        : otherUser?.email?.split('@')[0] || 'Anonymous';
                      
                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                          <div className="flex items-center space-x-4">
                            {otherUser?.profileImageUrl ? (
                              <img 
                                src={otherUser.profileImageUrl} 
                                alt={otherUserName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-muted-foreground"></i>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-foreground">{otherUserName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {otherUser?.role && <span className="capitalize">{otherUser.role}</span>}
                                {otherUser?.location && (
                                  <>
                                    {otherUser?.role && <span> • </span>}
                                    <span>{otherUser.location}</span>
                                  </>
                                )}
                                <span> • {match.compatibilityScore || 85}% match</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={match.status === 'mutual' ? 'default' : 'secondary'}>
                              {match.status === 'mutual' ? 'Mutual' : 'Pending'}
                            </Badge>
                            {match.status === 'mutual' ? (
                              <Button size="sm" className="gradient-primary">
                                Message
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline">
                                View Profile
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-muted-foreground text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No matches yet</h3>
                    <p className="text-muted-foreground mb-4">Start swiping to find your perfect co-founder!</p>
                    <Button asChild className="gradient-primary">
                      <Link href="/matching">
                        <i className="fas fa-heart mr-2"></i>
                        Start Matching
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Stats & Leaderboard */}
          <div className="space-y-8">
            {/* Your Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Leaderboard Rank</span>
                    <span className="font-bold text-yellow-600">
                      {userRank > 0 ? `#${userRank}` : 'Unranked'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Profile Views</span>
                    <span className="font-bold text-foreground">{user.profileViews || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Matches</span>
                    <span className="font-bold text-blue-600">{matches.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Mutual Matches</span>
                    <span className="font-bold text-green-600">{mutualMatches.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ideas Validated</span>
                    <span className="font-bold text-purple-600">{ideas.length}</span>
                  </div>
                </div>
                
                {user.subscriptionTier === 'free' && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg transition-all"
                      onClick={() => window.location.href = '/pricing'}
                    >
                      <i className="fas fa-crown mr-2"></i>
                      Upgrade to Pro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Mini Leaderboard */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Top Performers</CardTitle>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/leaderboard">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {topLeaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {topLeaderboard.map((leaderUser: any, index: number) => (
                      <LeaderboardCard 
                        key={leaderUser.id} 
                        user={leaderUser} 
                        rank={index + 1} 
                        isTopThree={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-trophy text-muted-foreground"></i>
                    </div>
                    <p className="text-muted-foreground text-sm">No leaderboard data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
