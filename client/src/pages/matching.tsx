import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import ProfileCard from "@/components/ProfileCard";
import type { User } from "@shared/types";

export default function Matching() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: potentialMatches = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/matches/potential"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const matchMutation = useMutation({
    mutationFn: async ({ targetUserId, interested }: { targetUserId: string; interested: boolean }) => {
      const response = await apiRequest("POST", "/api/matches", {
        targetUserId,
        interested,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.interested && data.status === 'mutual') {
        toast({
          title: "It's a Match! 🎉",
          description: "You both swiped right! Start chatting now.",
        });
      } else if (variables.interested) {
        toast({
          title: "Great Choice!",
          description: "Your interest has been sent. Waiting for their response.",
        });
      }
      
      // Invalidate and refetch matches
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      
      // Move to next profile
      handleNextProfile();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Action Failed",
        description: "Failed to process your choice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNextProfile = () => {
    if (currentIndex + 1 >= potentialMatches.length) {
      // No more profiles, refetch
      refetch();
      setCurrentIndex(0);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeLeft = () => {
    if (potentialMatches[currentIndex]) {
      setSwipeDirection("left");
      setTimeout(() => {
        matchMutation.mutate({
          targetUserId: potentialMatches[currentIndex].id,
          interested: false,
        });
        setSwipeDirection("");
      }, 300);
    }
  };

  const handleSwipeRight = () => {
    if (potentialMatches[currentIndex]) {
      setSwipeDirection("right");
      setTimeout(() => {
        matchMutation.mutate({
          targetUserId: potentialMatches[currentIndex].id,
          interested: true,
        });
        setSwipeDirection("");
      }, 300);
    }
  };

  const handleViewProfile = () => {
    // For now, just show a toast with more info
    const currentUser = potentialMatches[currentIndex];
    toast({
      title: "Profile Details",
      description: `${currentUser.firstName || 'User'} - ${currentUser.role || 'Entrepreneur'} ${currentUser.location ? `from ${currentUser.location}` : ''}`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-heart text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Finding potential co-founders...</p>
        </div>
      </div>
    );
  }

  const currentProfile = potentialMatches[currentIndex];

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
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Find Your Co-Founder</h1>
              <p className="text-gray-600">Swipe right to match, left to pass</p>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">
                {potentialMatches.length > 0 ? `${currentIndex + 1} of ${potentialMatches.length}` : '0 of 0'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        {potentialMatches.length === 0 ? (
          <Card className="text-center">
            <CardContent className="pt-6 pb-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-gray-400 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No More Profiles</h2>
              <p className="text-gray-600 mb-6">
                You've seen all available co-founders! Check back later for new profiles.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => refetch()} 
                  className="gradient-primary w-full"
                  disabled={isLoading}
                >
                  <i className="fas fa-refresh mr-2"></i>
                  Refresh Profiles
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/")}
                  className="w-full"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : currentProfile ? (
          <div className={`relative ${swipeDirection === 'left' ? 'swipe-left' : swipeDirection === 'right' ? 'swipe-right' : ''}`}>
            <ProfileCard
              user={currentProfile}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onViewProfile={handleViewProfile}
              compatibilityScore={85} // This would be calculated by the matching algorithm
            />
            
            {/* Swipe indicators */}
            {swipeDirection === 'right' && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                <i className="fas fa-heart mr-2"></i>
                LIKE
              </div>
            )}
            {swipeDirection === 'left' && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                <i className="fas fa-times mr-2"></i>
                PASS
              </div>
            )}
          </div>
        ) : (
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">Unable to load profiles at the moment.</p>
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Keyboard shortcuts hint */}
        {potentialMatches.length > 0 && (
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>
              Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">←</kbd> to pass, 
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs ml-1">→</kbd> to like
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
