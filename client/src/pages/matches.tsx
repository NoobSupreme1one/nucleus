import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import type { Match, Message, User } from "@shared/types";

export default function Matches() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<(Match & { user1: User; user2: User }) | null>(null);
  const [newMessage, setNewMessage] = useState("");

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

  const { data: allMatches = [], isLoading: matchesLoading } = useQuery<(Match & { user1: User; user2: User })[]>({
    queryKey: ["/api/matches"],
    enabled: !!user,
  });

  const { data: mutualMatches = [] } = useQuery<(Match & { user1: User; user2: User })[]>({
    queryKey: ["/api/matches/mutual"],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<(Message & { sender: User })[]>({
    queryKey: ["/api/matches", selectedMatch?.id, "messages"],
    enabled: !!selectedMatch?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ matchId, content }: { matchId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/matches/${matchId}/messages`, { content });
      return await response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/matches", selectedMatch?.id, "messages"] });
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
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-users text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  const getOtherUser = (match: any) => {
    return match.user1Id === user.id ? match.user2 : match.user1;
  };

  const getDisplayName = (user: any) => {
    return user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.email?.split('@')[0] || 'Anonymous';
  };

  const getMatchStatus = (match: any) => {
    if (match.status === 'mutual') return { text: 'Mutual Match', color: 'bg-green-100 text-green-800' };
    if (match.user1Id === user.id && match.user1Interested) return { text: 'Waiting for Response', color: 'bg-yellow-100 text-yellow-800' };
    if (match.user2Id === user.id && match.user2Interested) return { text: 'Waiting for Response', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'engineer': return 'fas fa-code';
      case 'designer': return 'fas fa-paint-brush';
      case 'marketer': return 'fas fa-bullhorn';
      default: return 'fas fa-user';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'engineer': return 'bg-blue-100 text-blue-800';
      case 'designer': return 'bg-purple-100 text-purple-800';
      case 'marketer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedMatch) return;
    
    sendMessageMutation.mutate({
      matchId: selectedMatch.id,
      content: newMessage.trim(),
    });
  };

  const pendingMatches = allMatches.filter((match: any) => match.status !== 'mutual');

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
                <i className="fas fa-users text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">Your Matches</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setLocation("/matching")}>
                <i className="fas fa-heart mr-1"></i>
                Find More
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/api/logout'}>
                <i className="fas fa-sign-out-alt mr-1"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">{allMatches.length}</div>
              <p className="text-gray-600">Total Matches</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{mutualMatches.length}</div>
              <p className="text-gray-600">Mutual Matches</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{pendingMatches.length}</div>
              <p className="text-gray-600">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Matches ({allMatches.length})</TabsTrigger>
            <TabsTrigger value="mutual">Mutual ({mutualMatches.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingMatches.length})</TabsTrigger>
          </TabsList>

          {/* All Matches Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Your Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : allMatches.length > 0 ? (
                  <div className="space-y-4">
                    {allMatches.map((match: any) => {
                      const otherUser = getOtherUser(match);
                      const matchStatus = getMatchStatus(match);
                      
                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            {otherUser?.profileImageUrl ? (
                              <img 
                                src={otherUser.profileImageUrl} 
                                alt={getDisplayName(otherUser)}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-gray-400"></i>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">{getDisplayName(otherUser)}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                {otherUser?.role && (
                                  <Badge className={getRoleColor(otherUser.role)}>
                                    <i className={`${getRoleIcon(otherUser.role)} mr-1`}></i>
                                    <span className="capitalize">{otherUser.role}</span>
                                  </Badge>
                                )}
                                {otherUser?.location && <span>{otherUser.location}</span>}
                                <span>• {match.compatibilityScore || 85}% match</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={matchStatus.color}>
                              {matchStatus.text}
                            </Badge>
                            {match.status === 'mutual' ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    className="gradient-primary"
                                    onClick={() => setSelectedMatch(match)}
                                  >
                                    <i className="fas fa-comment mr-1"></i>
                                    Message
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Chat with {getDisplayName(otherUser)}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="flex flex-col h-96">
                                    <ScrollArea className="flex-1 p-4 border rounded-lg custom-scrollbar">
                                      {messagesLoading ? (
                                        <div className="space-y-2">
                                          {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                                          ))}
                                        </div>
                                      ) : messages.length > 0 ? (
                                        <div className="space-y-3">
                                          {messages.map((message: any) => (
                                            <div
                                              key={message.id}
                                              className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                              <div
                                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                                  message.senderId === user.id
                                                    ? 'gradient-primary text-white'
                                                    : 'bg-gray-200 text-gray-900'
                                                }`}
                                              >
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${
                                                  message.senderId === user.id ? 'text-white/70' : 'text-gray-500'
                                                }`}>
                                                  {new Date(message.createdAt).toLocaleTimeString()}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center text-gray-500 py-8">
                                          <i className="fas fa-comment text-2xl mb-2"></i>
                                          <p>No messages yet. Start the conversation!</p>
                                        </div>
                                      )}
                                    </ScrollArea>
                                    <div className="flex space-x-2 mt-4">
                                      <Input
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="flex-1"
                                      />
                                      <Button 
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                        className="gradient-primary"
                                      >
                                        {sendMessageMutation.isPending ? (
                                          <i className="fas fa-spinner fa-spin"></i>
                                        ) : (
                                          <i className="fas fa-paper-plane"></i>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Button size="sm" variant="outline">
                                <i className="fas fa-eye mr-1"></i>
                                View Profile
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start swiping to find potential co-founders who match your skills and vision!
                    </p>
                    <Button 
                      className="gradient-primary"
                      onClick={() => setLocation("/matching")}
                    >
                      <i className="fas fa-heart mr-2"></i>
                      Start Matching
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mutual Matches Tab */}
          <TabsContent value="mutual">
            <Card>
              <CardHeader>
                <CardTitle>Mutual Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {mutualMatches.length > 0 ? (
                  <div className="space-y-4">
                    {mutualMatches.map((match: any) => {
                      const otherUser = getOtherUser(match);
                      
                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-4">
                            {otherUser?.profileImageUrl ? (
                              <img 
                                src={otherUser.profileImageUrl} 
                                alt={getDisplayName(otherUser)}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-gray-400"></i>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">{getDisplayName(otherUser)}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                {otherUser?.role && (
                                  <Badge className={getRoleColor(otherUser.role)}>
                                    <i className={`${getRoleIcon(otherUser.role)} mr-1`}></i>
                                    <span className="capitalize">{otherUser.role}</span>
                                  </Badge>
                                )}
                                {otherUser?.location && <span>{otherUser.location}</span>}
                                <span>• {match.compatibilityScore || 85}% match</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-green-100 text-green-800">
                              <i className="fas fa-heart mr-1"></i>
                              Mutual Match
                            </Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="gradient-primary"
                                  onClick={() => setSelectedMatch(match)}
                                >
                                  <i className="fas fa-comment mr-1"></i>
                                  Chat
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Chat with {getDisplayName(otherUser)}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col h-96">
                                  <ScrollArea className="flex-1 p-4 border rounded-lg custom-scrollbar">
                                    {messagesLoading ? (
                                      <div className="space-y-2">
                                        {[1, 2, 3].map((i) => (
                                          <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                                        ))}
                                      </div>
                                    ) : messages.length > 0 ? (
                                      <div className="space-y-3">
                                        {messages.map((message: any) => (
                                          <div
                                            key={message.id}
                                            className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                                          >
                                            <div
                                              className={`max-w-xs px-4 py-2 rounded-lg ${
                                                message.senderId === user.id
                                                  ? 'gradient-primary text-white'
                                                  : 'bg-gray-200 text-gray-900'
                                              }`}
                                            >
                                              <p className="text-sm">{message.content}</p>
                                              <p className={`text-xs mt-1 ${
                                                message.senderId === user.id ? 'text-white/70' : 'text-gray-500'
                                              }`}>
                                                {new Date(message.createdAt).toLocaleTimeString()}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center text-gray-500 py-8">
                                        <i className="fas fa-comment text-2xl mb-2"></i>
                                        <p>No messages yet. Start the conversation!</p>
                                      </div>
                                    )}
                                  </ScrollArea>
                                  <div className="flex space-x-2 mt-4">
                                    <Input
                                      placeholder="Type your message..."
                                      value={newMessage}
                                      onChange={(e) => setNewMessage(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                      className="flex-1"
                                    />
                                    <Button 
                                      onClick={handleSendMessage}
                                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                      className="gradient-primary"
                                    >
                                      {sendMessageMutation.isPending ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                      ) : (
                                        <i className="fas fa-paper-plane"></i>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-heart text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No mutual matches yet</h3>
                    <p className="text-gray-600 mb-4">
                      Keep swiping! When someone swipes right on your profile too, you'll see them here.
                    </p>
                    <Button 
                      className="gradient-primary"
                      onClick={() => setLocation("/matching")}
                    >
                      <i className="fas fa-heart mr-2"></i>
                      Continue Matching
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Matches Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingMatches.length > 0 ? (
                  <div className="space-y-4">
                    {pendingMatches.map((match: any) => {
                      const otherUser = getOtherUser(match);
                      const matchStatus = getMatchStatus(match);
                      
                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                          <div className="flex items-center space-x-4">
                            {otherUser?.profileImageUrl ? (
                              <img 
                                src={otherUser.profileImageUrl} 
                                alt={getDisplayName(otherUser)}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-gray-400"></i>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">{getDisplayName(otherUser)}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                {otherUser?.role && (
                                  <Badge className={getRoleColor(otherUser.role)}>
                                    <i className={`${getRoleIcon(otherUser.role)} mr-1`}></i>
                                    <span className="capitalize">{otherUser.role}</span>
                                  </Badge>
                                )}
                                {otherUser?.location && <span>{otherUser.location}</span>}
                                <span>• {match.compatibilityScore || 85}% match</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={matchStatus.color}>
                              {matchStatus.text}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <i className="fas fa-eye mr-1"></i>
                              View Profile
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-clock text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending matches</h3>
                    <p className="text-gray-600 mb-4">
                      All your matches have been resolved. Keep swiping to find more potential co-founders!
                    </p>
                    <Button 
                      className="gradient-primary"
                      onClick={() => setLocation("/matching")}
                    >
                      <i className="fas fa-heart mr-2"></i>
                      Find New Matches
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
