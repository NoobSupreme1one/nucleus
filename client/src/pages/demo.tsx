import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface DemoFormData {
  title: string;
  marketCategory: string;
  problemDescription: string;
  solutionDescription: string;
  targetAudience: string;
}

const sampleResults = {
  "AI-powered fitness coach app": {
    score: 847,
    grade: "Excellent",
    color: "bg-green-500",
    marketPotential: 92,
    technicalFeasibility: 88,
    executionRisk: 85,
    executiveSummary: "Your AI-powered fitness coach app addresses a significant market opportunity in the growing health tech sector. With strong technical feasibility and manageable execution complexity, this idea shows excellent potential for success.",
    recommendations: [
      "Start with MVP focusing on personalized workout plans",
      "Partner with certified fitness trainers for content validation",
      "Implement freemium model with premium AI coaching features"
    ]
  },
  "Sustainable food delivery platform": {
    score: 782,
    grade: "Very Good",
    color: "bg-blue-500",
    marketPotential: 89,
    technicalFeasibility: 75,
    executionRisk: 78,
    executiveSummary: "The sustainable food delivery concept taps into growing environmental consciousness and food delivery trends. While technically feasible, execution will require careful logistics planning and strong supplier relationships.",
    recommendations: [
      "Focus on local partnerships with sustainable restaurants",
      "Develop carbon footprint tracking for transparency",
      "Create subscription model for regular eco-conscious customers"
    ]
  },
  "Remote team collaboration tool": {
    score: 723,
    grade: "Good",
    color: "bg-yellow-500",
    marketPotential: 85,
    technicalFeasibility: 82,
    executionRisk: 65,
    executiveSummary: "Remote collaboration tools remain in high demand post-pandemic. Your concept shows solid potential, though the market is competitive. Focus on unique features and specific niches for differentiation.",
    recommendations: [
      "Identify specific pain points not addressed by existing tools",
      "Target niche markets like creative teams or healthcare",
      "Emphasize security and compliance features for enterprise"
    ]
  }
};

export default function Demo() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState<DemoFormData>({
    title: "",
    marketCategory: "",
    problemDescription: "",
    solutionDescription: "",
    targetAudience: "",
  });

  const handleInputChange = (field: keyof DemoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis with realistic timing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsAnalyzing(false);
    setShowResults(true);
  };

  const getResultsForIdea = () => {
    const title = formData.title.toLowerCase();
    if (title.includes("fitness") || title.includes("health") || title.includes("workout")) {
      return sampleResults["AI-powered fitness coach app"];
    } else if (title.includes("food") || title.includes("delivery") || title.includes("sustainable")) {
      return sampleResults["Sustainable food delivery platform"];
    } else {
      return sampleResults["Remote team collaboration tool"];
    }
  };

  const results = getResultsForIdea();

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-xl mb-8">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-white text-3xl"></i>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Demo Analysis Complete!</CardTitle>
              <p className="text-gray-600">Here's what our AI analysis would look like for your idea</p>
            </CardHeader>
            
            <CardContent>
              {/* Score Display */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div className="text-center relative z-10">
                  <div className="relative inline-block mb-6">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200" />
                      <circle
                        cx="60" cy="60" r="50" stroke="url(#gradient)" strokeWidth="8" fill="none"
                        strokeDasharray={`${results.score * 314 / 1000} 314`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(249, 83%, 65%)" />
                          <stop offset="100%" stopColor="hsl(262, 83%, 70%)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">{results.score}</div>
                        <div className="text-xs text-gray-500">/ 1000</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Badge className={`${results.color} text-white text-lg px-4 py-2`}>
                      <i className="fas fa-award mr-2"></i>
                      {results.grade}
                    </Badge>
                  </div>
                  
                  <div className="bg-white/50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center justify-center">
                      <i className="fas fa-robot mr-2 text-primary"></i>
                      AI Analysis Summary
                    </h4>
                    <p className="text-sm text-gray-700 max-w-2xl mx-auto leading-relaxed">
                      {results.executiveSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-bullseye text-white text-lg"></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">Market Potential</h3>
                      </div>
                      <Badge variant="outline" className="bg-white">{results.marketPotential}%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${results.marketPotential}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-cogs text-white text-lg"></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">Technical Feasibility</h3>
                      </div>
                      <Badge variant="outline" className="bg-white">{results.technicalFeasibility}%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${results.technicalFeasibility}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-rocket text-white text-lg"></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">Execution Score</h3>
                      </div>
                      <Badge variant="outline" className="bg-white">{results.executionRisk}%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${results.executionRisk}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 mb-8">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-lightbulb text-blue-500 mr-2"></i>
                    Key Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready for the Full Analysis?</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  This is just a preview! Get comprehensive analysis with detailed market research, competitive analysis, and a complete business plan.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    className="gradient-primary hover:shadow-xl transition-all px-8 py-4 text-lg group"
                    onClick={() => setLocation("/login")}
                  >
                    <i className="fas fa-rocket mr-2 group-hover:scale-110 transition-transform"></i>
                    Get Full Analysis
                    <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline" 
                    className="px-8 py-4 text-lg hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    onClick={() => {
                      setShowResults(false);
                      setCurrentStep(1);
                      setFormData({
                        title: "",
                        marketCategory: "",
                        problemDescription: "",
                        solutionDescription: "",
                        targetAudience: "",
                      });
                    }}
                  >
                    Try Another Idea
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-to-r from-primary to-secondary text-white mb-4 px-4 py-2">
            <i className="fas fa-play mr-2"></i>
            Interactive Demo
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            See How Our AI Validates Startup Ideas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our validation process with a sample idea. No signup required!
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <i className="fas fa-lightbulb text-primary mr-3"></i>
              Try Our AI Validation
            </CardTitle>
            <p className="text-gray-600">
              Enter a startup idea below and see how our AI would analyze it
            </p>
          </CardHeader>
          
          <CardContent>
            {isAnalyzing ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <i className="fas fa-brain text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI is Analyzing Your Idea...</h3>
                <p className="text-gray-600 mb-6">
                  Our AI is evaluating market potential, technical feasibility, and execution complexity
                </p>
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startup Idea Title
                  </label>
                  <Input 
                    placeholder="e.g., AI-powered fitness coach app" 
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market Category
                  </label>
                  <Select value={formData.marketCategory} onValueChange={(value) => handleInputChange('marketCategory', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="fintech">FinTech</SelectItem>
                      <SelectItem value="healthtech">HealthTech</SelectItem>
                      <SelectItem value="edtech">EdTech</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Problem Description
                  </label>
                  <Textarea 
                    rows={4}
                    placeholder="What problem does your startup solve? Be specific about the pain points."
                    className="resize-none"
                    value={formData.problemDescription}
                    onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Solution
                  </label>
                  <Textarea 
                    rows={4}
                    placeholder="How does your product solve this problem? What makes it unique?"
                    className="resize-none"
                    value={formData.solutionDescription}
                    onChange={(e) => handleInputChange('solutionDescription', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <Textarea 
                    rows={3}
                    placeholder="Who are your ideal customers? Be specific about demographics and characteristics."
                    className="resize-none"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  />
                </div>
                
                <Button 
                  size="lg"
                  className="w-full gradient-primary hover:shadow-lg transition-all text-lg py-4"
                  onClick={handleAnalyze}
                  disabled={!formData.title || !formData.marketCategory || !formData.problemDescription}
                >
                  <i className="fas fa-magic mr-2"></i>
                  Analyze My Idea (Demo)
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  <i className="fas fa-info-circle mr-1"></i>
                  This is a demo with sample results. Sign up for real AI analysis!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
