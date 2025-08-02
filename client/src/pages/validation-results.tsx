import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import type { Idea } from "@shared/types";
import { ProReportDisplay } from "@/components/ProReportDisplay";

interface ValidationResultsProps {
  params: {
    ideaId: string;
  };
}

export default function ValidationResults({ params }: ValidationResultsProps) {
  const [, setLocation] = useLocation();
  const [isGeneratingProReport, setIsGeneratingProReport] = useState(false);

  const { data: idea, isLoading, error, refetch } = useQuery<Idea>({
    queryKey: ["/api/ideas", params.ideaId],
  });

  // Get current user to check subscription status
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  // Enhanced Pro validation mutation
  const generateProReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ideas/${params.ideaId}/generate-pro-report`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to generate Pro report');
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setIsGeneratingProReport(false);
    },
    onError: (error) => {
      console.error('Error generating Pro report:', error);
      setIsGeneratingProReport(false);
    },
  });

  const handleGenerateProReport = () => {
    if (user?.subscriptionTier !== 'pro') {
      // Redirect to pricing page
      setLocation('/pricing');
      return;
    }
    setIsGeneratingProReport(true);
    generateProReportMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-chart-line text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Loading validation results...</p>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Results Not Found</h2>
            <p className="text-gray-600 mb-4">We couldn't find the validation results for this idea.</p>
            <Button onClick={() => setLocation("/")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validation = idea.analysisReport as any;
  const score = idea.validationScore || 0;
  
  // Check if this is comprehensive validation result
  const isComprehensive = validation && validation.marketAnalysis && validation.executiveSummary;
  
  // Check if enhanced scoring is available
  const hasEnhancedScoring = validation && validation.enhancedScoring;
  
  // Check if Pro report exists
  const hasProReport = validation && validation.proReport;
  const isProUser = user?.subscriptionTier === 'pro';

  const getScoreColor = (score: number) => {
    if (score >= 850) return "text-green-600";
    if (score >= 750) return "text-blue-600";
    if (score >= 650) return "text-yellow-600";
    if (score >= 550) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 850) return { text: "Exceptional - Drop Everything!", color: "bg-green-100 text-green-800" };
    if (score >= 750) return { text: "Strong - Develop Further", color: "bg-blue-100 text-blue-800" };
    if (score >= 650) return { text: "Moderate - Needs Improvement", color: "bg-yellow-100 text-yellow-800" };
    if (score >= 550) return { text: "Weak - Consider Pivots", color: "bg-orange-100 text-orange-800" };
    return { text: "Poor - Move On", color: "bg-red-100 text-red-800" };
  };

  const scoreBadge = getScoreBadge(score);

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
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">Validation Results</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <Card className="shadow-xl mb-8">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-white text-3xl"></i>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Validation Complete!</CardTitle>
            <p className="text-gray-600">Your startup idea has been analyzed</p>
          </CardHeader>
          
          <CardContent>
            {/* Score Display */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-8">
              <div className="text-center">
                <div className={`text-6xl font-bold gradient-text mb-2`}>
                  {hasEnhancedScoring ? validation.enhancedScoring.overallScore : score}
                </div>
                <div className="text-xl text-gray-600 mb-4">out of 1,000 points</div>
                <Badge className={scoreBadge.color}>
                  <i className="fas fa-thumbs-up mr-2"></i>
                  {hasEnhancedScoring ? validation.enhancedScoring.gradeLevel : scoreBadge.text}
                </Badge>
                {hasEnhancedScoring && validation.enhancedScoring.recommendation && (
                  <p className="text-sm text-gray-600 mt-3 max-w-2xl mx-auto">
                    {validation.enhancedScoring.recommendation}
                  </p>
                )}
              </div>
            </div>

            {/* Idea Details */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{idea.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Market Category</h3>
                  <p className="text-gray-600 capitalize">{idea.marketCategory}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Validation Date</h3>
                  <p className="text-gray-600">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            {validation && (
              <>
                {/* Executive Summary for Comprehensive Analysis */}
                {isComprehensive && validation.executiveSummary && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <i className="fas fa-chart-line text-blue-500 mr-2"></i>
                        Executive Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed mb-4">{validation.executiveSummary}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <Badge variant="outline">
                          <i className="fas fa-shield-alt mr-1"></i>
                          Confidence: {validation.confidenceLevel || 'Medium'}
                        </Badge>
                        <Badge variant="outline">
                          <i className="fas fa-clock mr-1"></i>
                          Updated: {new Date(validation.lastUpdated || Date.now()).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Scoring Breakdown */}
                {hasEnhancedScoring && validation.enhancedScoring && (
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 mb-8">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                        <i className="fas fa-chart-bar text-indigo-500 mr-2"></i>
                        Enhanced 1000-Point Scoring Breakdown
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Designed specifically for solo developers with focus on execution feasibility
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {Object.entries(validation.enhancedScoring.categories).map(([categoryKey, category]: [string, any]) => (
                          <div key={categoryKey} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm text-gray-900">{category.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {category.score}/{category.maxScore}
                              </Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className={`h-2 rounded-full ${
                                  (category.score / category.maxScore) >= 0.8 ? 'bg-green-500' :
                                  (category.score / category.maxScore) >= 0.6 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.max(5, (category.score / category.maxScore) * 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600">
                              {Math.round((category.score / category.maxScore) * 100)}% score
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* SWOT Analysis */}
                      {validation.enhancedScoring.detailedAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-green-50 rounded-lg p-4">
                              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                                <i className="fas fa-thumbs-up mr-2"></i>
                                Strengths
                              </h4>
                              <ul className="space-y-1 text-sm text-green-700">
                                {validation.enhancedScoring.detailedAnalysis.strengths?.slice(0, 3).map((strength: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                <i className="fas fa-lightbulb mr-2"></i>
                                Opportunities
                              </h4>
                              <ul className="space-y-1 text-sm text-blue-700">
                                {validation.enhancedScoring.detailedAnalysis.opportunities?.slice(0, 3).map((opportunity: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                    <span>{opportunity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-red-50 rounded-lg p-4">
                              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                Weaknesses
                              </h4>
                              <ul className="space-y-1 text-sm text-red-700">
                                {validation.enhancedScoring.detailedAnalysis.weaknesses?.slice(0, 3).map((weakness: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="bg-orange-50 rounded-lg p-4">
                              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                                <i className="fas fa-shield-alt mr-2"></i>
                                Threats
                              </h4>
                              <ul className="space-y-1 text-sm text-orange-700">
                                {validation.enhancedScoring.detailedAnalysis.threats?.slice(0, 3).map((threat: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                                    <span>{threat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Next Steps */}
                      {validation.enhancedScoring.detailedAnalysis?.nextSteps && (
                        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                            <i className="fas fa-road mr-2"></i>
                            Recommended Next Steps
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {validation.enhancedScoring.detailedAnalysis.nextSteps.slice(0, 4).map((step: string, index: number) => (
                              <div key={index} className="flex items-start text-sm text-purple-700">
                                <span className="inline-block w-5 h-5 bg-purple-200 text-purple-800 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                  {index + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Analysis Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Market Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Market Size</span>
                          <Badge variant="outline" className="capitalize">
                            {validation.marketAnalysis?.marketSize || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Competition</span>
                          <Badge variant="outline" className="capitalize">
                            {validation.marketAnalysis?.competition || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trends</span>
                          <Badge variant="outline" className="capitalize">
                            {validation.marketAnalysis?.trends || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="font-semibold">Score</span>
                            <span className="font-bold text-primary">
                              {hasEnhancedScoring ? 
                                `${validation.enhancedScoring.categories.marketOpportunity.score}/150` : 
                                `${validation.marketAnalysis?.score || 0}/400`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Enhanced Market Details */}
                      {isComprehensive && validation.marketAnalysis?.detailedInsights && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-semibold text-gray-900 mb-2">Market Insights</h4>
                          <p className="text-sm text-gray-600">{validation.marketAnalysis.detailedInsights}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Technical Feasibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Complexity</span>
                          <Badge variant="outline" className="capitalize">
                            {validation.technicalFeasibility?.complexity || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Resources Needed</span>
                          <Badge variant="outline" className="capitalize">
                            {validation.technicalFeasibility?.resourcesNeeded || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time to Market</span>
                          <Badge variant="outline">
                            {validation.technicalFeasibility?.timeToMarket || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="font-semibold">Score</span>
                            <span className="font-bold text-primary">
                              {hasEnhancedScoring ? 
                                `${validation.enhancedScoring.categories.executionFeasibility.score}/140` : 
                                `${validation.technicalFeasibility?.score || 0}/300`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Enhanced Technical Details */}
                      {isComprehensive && validation.technicalFeasibility?.implementationRoadmap && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-semibold text-gray-900 mb-2">Implementation Roadmap</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {validation.technicalFeasibility.implementationRoadmap.slice(0, 3).map((step: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-4 h-4 bg-primary/20 text-primary rounded-full text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">{index + 1}</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Business Model Analysis for Comprehensive Results */}
                {isComprehensive && validation.businessModel && (
                  <Card className="bg-green-50 mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <i className="fas fa-business-time text-green-500 mr-2"></i>
                        Business Model Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Revenue Streams</h4>
                          <ul className="space-y-2">
                            {validation.businessModel.revenueStreams?.slice(0, 3).map((stream: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <i className="fas fa-dollar-sign text-green-500 mr-2 mt-0.5"></i>
                                <span>{stream}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Key Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Business Score</span>
                              <span className="font-semibold">{validation.businessModel.score}/300</span>
                            </div>
                            <div className="text-gray-600">
                              <p>{validation.businessModel.monetizationStrategy}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Strategic Recommendations - Enhanced for Comprehensive Results */}
                {(validation.recommendations || validation.strategicRecommendations) && (
                  <div className="mb-8">
                    {isComprehensive && validation.strategicRecommendations ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Immediate Actions */}
                        <Card className="bg-red-50">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center">
                              <i className="fas fa-bolt text-red-500 mr-2"></i>
                              Immediate Actions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 text-sm">
                              {validation.strategicRecommendations.immediate?.slice(0, 3).map((rec: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <i className="fas fa-circle text-red-400 mr-2 mt-1 text-xs"></i>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        {/* Short Term */}
                        <Card className="bg-yellow-50">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center">
                              <i className="fas fa-calendar-alt text-yellow-500 mr-2"></i>
                              Short Term (3-6 months)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 text-sm">
                              {validation.strategicRecommendations.shortTerm?.slice(0, 3).map((rec: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <i className="fas fa-circle text-yellow-400 mr-2 mt-1 text-xs"></i>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        {/* Long Term */}
                        <Card className="bg-green-50">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center">
                              <i className="fas fa-telescope text-green-500 mr-2"></i>
                              Long Term (6+ months)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 text-sm">
                              {validation.strategicRecommendations.longTerm?.slice(0, 3).map((rec: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <i className="fas fa-circle text-green-400 mr-2 mt-1 text-xs"></i>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card className="bg-blue-50">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <i className="fas fa-lightbulb text-blue-500 mr-2"></i>
                            Key Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-gray-700">
                            {(validation.recommendations || []).map((rec: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <i className="fas fa-check-circle text-green-500 mr-2 mt-1 text-sm"></i>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Competitive Intelligence for Comprehensive Results */}
                {isComprehensive && validation.competitiveIntelligence && (
                  <Card className="bg-purple-50 mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <i className="fas fa-chess text-purple-500 mr-2"></i>
                        Competitive Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Competitive Advantages</h4>
                          <ul className="space-y-2 text-sm">
                            {validation.competitiveIntelligence.competitiveAdvantages?.slice(0, 3).map((advantage: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <i className="fas fa-star text-purple-500 mr-2 mt-0.5"></i>
                                <span>{advantage}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Differentiation Strategy</h4>
                          <p className="text-sm text-gray-700">{validation.competitiveIntelligence.differentiationStrategy}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Analysis */}
                {validation.detailedAnalysis && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg">Detailed Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">
                        {validation.detailedAnalysis}
                      </p>
                      {/* Research Sources for Comprehensive Results */}
                      {isComprehensive && validation.researchSources && validation.researchSources.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <h4 className="font-semibold text-gray-900 mb-2">Research Sources</h4>
                          <div className="flex flex-wrap gap-2">
                            {validation.researchSources.map((source: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <i className="fas fa-database mr-1"></i>
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            
            {/* Pro Report Section */}
            {!hasProReport && (
              <Card className="mb-8 border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-crown text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Get Your Detailed Pro Report</h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                      Unlock comprehensive market research, competitor analysis, sample UI mockups, curated resource lists, and detailed implementation roadmaps designed specifically for your startup idea.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 max-w-4xl mx-auto">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <i className="fas fa-search text-blue-600"></i>
                        </div>
                        <p className="text-sm font-medium">Deep Market Research</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <i className="fas fa-users text-green-600"></i>
                        </div>
                        <p className="text-sm font-medium">Competitor Analysis</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <i className="fas fa-paint-brush text-purple-600"></i>
                        </div>
                        <p className="text-sm font-medium">UI/Landing Mockups</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <i className="fas fa-book text-orange-600"></i>
                        </div>
                        <p className="text-sm font-medium">Curated Resources</p>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={handleGenerateProReport}
                      disabled={!isProUser || isGeneratingProReport}
                      className={`px-8 py-3 ${!isProUser ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'gradient-primary hover:shadow-lg'} transition-all`}
                    >
                      {isGeneratingProReport ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Generating Detailed Report...
                        </>
                      ) : !isProUser ? (
                        <>
                          <i className="fas fa-lock mr-2"></i>
                          Upgrade to Pro to Unlock
                        </>
                      ) : (
                        <>
                          <i className="fas fa-rocket mr-2"></i>
                          Generate Detailed Report
                        </>
                      )}
                    </Button>
                    
                    {!isProUser && (
                      <p className="text-sm text-gray-500 mt-2">
                        Upgrade to Pro for $29/month to access detailed reports
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pro Report Content */}
            {hasProReport && validation.proReport && (
              <div className="mb-8">
                <Separator />
                <div className="mt-8">
                  <ProReportDisplay
                    proReport={validation.proReport}
                    ideaTitle={idea.title}
                  />
                </div>
              </div>
            )}



            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="gradient-primary hover:shadow-lg transition-all px-8 py-3"
                onClick={() => setLocation("/matching")}
              >
                Find Co-Founders Now
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="px-8 py-3 hover:border-primary hover:text-primary transition-all"
                onClick={() => setLocation("/validate-idea")}
              >
                Validate Another Idea
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
