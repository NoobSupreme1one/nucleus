import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const ideaSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  marketCategory: z.enum(['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other']),
  problemDescription: z.string().min(20, "Problem description must be at least 20 characters").max(1000, "Problem description must be less than 1000 characters"),
  solutionDescription: z.string().min(20, "Solution description must be at least 20 characters").max(1000, "Solution description must be less than 1000 characters"),
  targetAudience: z.string().min(10, "Target audience must be at least 10 characters").max(500, "Target audience must be less than 500 characters"),
});

type IdeaFormData = z.infer<typeof ideaSchema>;

export default function IdeaValidation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: "",
      marketCategory: undefined,
      problemDescription: "",
      solutionDescription: "",
      targetAudience: "",
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (data: IdeaFormData) => {
      const response = await apiRequest("POST", "/api/ideas/validate", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Idea Validated!",
        description: `Your idea scored ${data.validation.overallScore} out of 1000 points.`,
      });
      setLocation(`/validation-results/${data.ideaId}`);
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
        title: "Validation Failed",
        description: "Failed to validate your idea. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IdeaFormData) => {
    validateMutation.mutate(data);
  };

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
                <i className="fas fa-lightbulb text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">Idea Validation</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-20">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lightbulb text-white text-2xl"></i>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Validate Your Startup Idea</CardTitle>
            <p className="text-gray-600">Get AI-powered analysis with our 1,000-point scoring system</p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startup Idea Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., AI-powered fitness coach app" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="marketCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="saas">SaaS / Software</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="fintech">FinTech</SelectItem>
                          <SelectItem value="healthtech">HealthTech</SelectItem>
                          <SelectItem value="edtech">EdTech</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="problemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4}
                          placeholder="What problem does your startup solve? Be specific about the pain points."
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="solutionDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposed Solution</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4}
                          placeholder="How does your product solve this problem? What makes it unique?"
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3}
                          placeholder="Who are your ideal customers? Be specific about demographics and characteristics."
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
                  size="lg"
                  className="w-full gradient-primary hover:shadow-lg transition-all text-lg py-4"
                  disabled={validateMutation.isPending}
                >
                  {validateMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Validating Your Idea...
                    </>
                  ) : (
                    <>
                      Validate My Idea <i className="fas fa-arrow-right ml-2"></i>
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
