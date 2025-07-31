import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeaderboardCard from "@/components/LeaderboardCard";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: leaderboard = [], isLoading: leaderboardLoading, error } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  if (error && isUnauthorizedError(error)) {
    useEffect(() => {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }, [toast]);
    return null;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-trophy text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // Filter leaderboard based on search and role
  const filteredLeaderboard = leaderboard.filter((leaderUser: User) => {
    const matchesSearch = searchTerm === "" || 
      (leaderUser.firstName && leaderUser.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leaderUser.lastName && leaderUser.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leaderUser.location && leaderUser.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || leaderUser.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const userRank = leaderboard.findIndex((u: User) => u.id === user.id) + 1;
  const topThree = filteredLeaderboard.slice(0, 3);
  const remaining = filteredLeaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to Dashboard</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-trophy text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">Leaderboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <a href="/api/logout">
                  <i className="fas fa-sign-out-alt mr-1"></i>
                  Logout
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Top <span className="gradient-text">Innovators</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the entrepreneurs with the highest-scoring startup ideas and proven track records
          </p>
        </div>

        {/* User's Position Banner */}
        {userRank > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Your profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-primary"></i>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">Your Position</h3>
                    <p className="text-gray-600">
                      You're ranked #{userRank} out of {leaderboard.length} entrepreneurs
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{user.totalIdeaScore || 0}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="engineer">Engineers</SelectItem>
                  <SelectItem value="designer">Designers</SelectItem>
                  <SelectItem value="marketer">Marketers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {filteredLeaderboard.length === leaderboard.length ? 'Top 100 Entrepreneurs' : `Filtered Results (${filteredLeaderboard.length})`}
              </CardTitle>
              <Badge className="gradient-primary text-white">
                <i className="fas fa-crown mr-1"></i>
                Elite
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredLeaderboard.length > 0 ? (
              <div className="space-y-4">
                {/* Top 3 with special styling */}
                {topThree.map((leaderUser: any, index: number) => (
                  <LeaderboardCard 
                    key={leaderUser.id} 
                    user={leaderUser} 
                    rank={index + 1} 
                    isTopThree={true}
                    showFullProfile={true}
                  />
                ))}
                
                {/* Rest of the leaderboard */}
                {remaining.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    {remaining.map((leaderUser: any, index: number) => (
                      <LeaderboardCard 
                        key={leaderUser.id} 
                        user={leaderUser} 
                        rank={index + 4} 
                        isTopThree={false}
                        showFullProfile={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : searchTerm || roleFilter !== "all" ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-trophy text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No leaderboard data yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to validate your startup idea and claim the top spot!
                </p>
                <Button 
                  className="gradient-primary"
                  onClick={() => setLocation("/validate-idea")}
                >
                  <i className="fas fa-lightbulb mr-2"></i>
                  Validate Your Idea
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Section */}
        {filteredLeaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.max(...filteredLeaderboard.map((u: any) => u.totalIdeaScore || 0))}
                </div>
                <p className="text-gray-600">Highest Score</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round(filteredLeaderboard.reduce((sum: number, u: any) => sum + (u.totalIdeaScore || 0), 0) / filteredLeaderboard.length) || 0}
                </div>
                <p className="text-gray-600">Average Score</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {filteredLeaderboard.length}
                </div>
                <p className="text-gray-600">Active Entrepreneurs</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
