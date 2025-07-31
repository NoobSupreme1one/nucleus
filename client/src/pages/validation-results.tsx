import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Idea } from "@shared/schema";

interface ValidationResultsProps {
  params: {
    ideaId: string;
  };
}

export default function ValidationResults({ params }: ValidationResultsProps) {
  const [, setLocation] = useLocation();

  const { data: idea, isLoading, error } = useQuery<Idea>({
    queryKey: ["/api/ideas", params.ideaId],
  });

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

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-green-600";
    if (score >= 600) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 800) return { text: "Excellent Potential", color: "bg-green-100 text-green-800" };
    if (score >= 600) return { text: "Strong Potential", color: "bg-yellow-100 text-yellow-800" };
    if (score >= 400) return { text: "Moderate Potential", color: "bg-orange-100 text-orange-800" };
    return { text: "Needs Improvement", color: "bg-red-100 text-red-800" };
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
                  {score}
                </div>
                <div className="text-xl text-gray-600 mb-4">out of 1,000 points</div>
                <Badge className={scoreBadge.color}>
                  <i className="fas fa-thumbs-up mr-2"></i>
                  {scoreBadge.text}
                </Badge>
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
                              {validation.marketAnalysis?.score || 0}/400
                            </span>
                          </div>
                        </div>
                      </div>
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
                              {validation.technicalFeasibility?.score || 0}/300
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Recommendations */}
                {validation.recommendations && validation.recommendations.length > 0 && (
                  <Card className="bg-blue-50 mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <i className="fas fa-lightbulb text-blue-500 mr-2"></i>
                        Key Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-gray-700">
                        {validation.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 mr-2 mt-1 text-sm"></i>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
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
                    </CardContent>
                  </Card>
                )}
              </>
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
