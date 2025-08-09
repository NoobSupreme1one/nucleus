import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import type { Submission } from "@shared/types";

const profileSchema = z.object({
  role: z.enum(['engineer', 'designer', 'marketer']),
  location: z.string().min(2, "Location must be at least 2 characters").max(100, "Location must be less than 100 characters"),
  bio: z.string().min(20, "Bio must be at least 20 characters").max(500, "Bio must be less than 500 characters"),
});

const submissionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description must be less than 1000 characters"),
  portfolioUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Please enter a valid GitHub URL").optional().or(z.literal("")),
  liveUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  role: z.enum(['engineer', 'designer', 'marketer']),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type SubmissionFormData = z.infer<typeof submissionSchema>;

export default function Portfolio() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

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

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
    enabled: !!user,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: user?.role || undefined,
      location: user?.location || "",
      bio: user?.bio || "",
    },
  });

  const submissionForm = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: "",
      description: "",
      portfolioUrl: "",
      githubUrl: "",
      liveUrl: "",
      role: user?.role || undefined,
    },
  });

  // Update form defaults when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        role: user.role || undefined,
        location: user.location || "",
        bio: user.bio || "",
      });
      submissionForm.setValue("role", user.role || "engineer");
    }
  }, [user, profileForm, submissionForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/auth/user", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      
      if (selectedFiles) {
        Array.from(selectedFiles).forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission Created!",
        description: "Your portfolio submission has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      submissionForm.reset();
      setSelectedFiles(null);
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
        title: "Submission Failed",
        description: "Failed to create your submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-briefcase text-white text-2xl"></i>
          </div>
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmissionSubmit = (data: SubmissionFormData) => {
    createSubmissionMutation.mutate(data);
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
      default: return 'bg-muted text-foreground';
    }
  };

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
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
                <i className="fas fa-briefcase text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-foreground">Portfolio</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setLocation("/leaderboard")}>
                <i className="fas fa-trophy mr-1"></i>
                Leaderboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/api/logout'}>
                <i className="fas fa-sign-out-alt mr-1"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-muted-foreground text-3xl"></i>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
                <div className="flex items-center space-x-2 mt-2">
                  {user.role && (
                    <Badge className={getRoleColor(user.role)}>
                      <i className={`${getRoleIcon(user.role)} mr-1`}></i>
                      <span className="capitalize">{user.role}</span>
                    </Badge>
                  )}
                  {user.location && (
                    <Badge variant="outline">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {user.location}
                    </Badge>
                  )}
                  <Badge className="gradient-primary text-white">
                    <i className="fas fa-star mr-1"></i>
                    {user.totalIdeaScore || 0} points
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="submissions">Portfolio Submissions</TabsTrigger>
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Update Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your primary role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="engineer">Engineer / Developer</SelectItem>
                              <SelectItem value="designer">Designer / UX</SelectItem>
                              <SelectItem value="marketer">Marketer / Growth</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="City, State/Country" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={4}
                              placeholder="Tell us about yourself, your experience, and what you're looking for in a co-founder..."
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="gradient-primary hover:shadow-lg transition-all"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Update Profile
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="space-y-8">
              {/* Create New Submission */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Portfolio Submission</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...submissionForm}>
                    <form onSubmit={submissionForm.handleSubmit(onSubmissionSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={submissionForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Title</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., E-commerce Mobile App" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={submissionForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Submission Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role for this submission" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="engineer">Engineer / Developer</SelectItem>
                                  <SelectItem value="designer">Designer / UX</SelectItem>
                                  <SelectItem value="marketer">Marketer / Growth</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={submissionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={4}
                                placeholder="Describe your project, technologies used, challenges solved, and key achievements..."
                                className="resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={submissionForm.control}
                          name="portfolioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://yourportfolio.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={submissionForm.control}
                          name="githubUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GitHub URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://github.com/user/repo" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={submissionForm.control}
                          name="liveUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Live Demo URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://yourdemo.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Attachments (Images, Documents)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                          onChange={(e) => setSelectedFiles(e.target.files)}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload images, documents, or other files to showcase your work (max 10MB each)
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="gradient-primary hover:shadow-lg transition-all"
                        disabled={createSubmissionMutation.isPending}
                      >
                        {createSubmissionMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Creating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-plus mr-2"></i>
                            Add Submission
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Existing Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Portfolio Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissionsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                          <div className="h-4 bg-muted rounded mb-2 w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : submissions.length > 0 ? (
                    <div className="space-y-4">
                      {submissions.map((submission: any) => (
                        <div key={submission.id} className="p-6 border border-border rounded-lg hover:border-primary/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{submission.title}</h3>
                                <Badge className={getRoleColor(submission.role)}>
                                  <i className={`${getRoleIcon(submission.role)} mr-1`}></i>
                                  <span className="capitalize">{submission.role}</span>
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-4">{submission.description}</p>
                              
                              <div className="flex flex-wrap gap-2">
                                {submission.portfolioUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={submission.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                      <i className="fas fa-external-link-alt mr-1"></i>
                                      Portfolio
                                    </a>
                                  </Button>
                                )}
                                {submission.githubUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                                      <i className="fab fa-github mr-1"></i>
                                      GitHub
                                    </a>
                                  </Button>
                                )}
                                {submission.liveUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer">
                                      <i className="fas fa-play mr-1"></i>
                                      Live Demo
                                    </a>
                                  </Button>
                                )}
                                {submission.fileUrls && submission.fileUrls.length > 0 && (
                                  <Badge variant="outline">
                                    <i className="fas fa-paperclip mr-1"></i>
                                    {submission.fileUrls.length} file{submission.fileUrls.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="text-sm text-muted-foreground">
                                {new Date(submission.createdAt).toLocaleDateString()}
                              </div>
                              {submission.qualityScore > 0 && (
                                <div className="text-lg font-bold text-primary">
                                  {submission.qualityScore}/100
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-briefcase text-muted-foreground text-2xl"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No submissions yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first portfolio submission to showcase your skills and attract co-founders
                      </p>
                      <Button 
                        className="gradient-primary"
                        onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Add Your First Submission
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
