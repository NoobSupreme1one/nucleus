import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FundingOpportunity } from "@shared/types";

interface FundingOpportunitiesSectionProps {
  data: FundingOpportunity[];
}

export function FundingOpportunitiesSection({ data }: FundingOpportunitiesSectionProps) {
  const getFundingTypeIcon = (type: FundingOpportunity['type']) => {
    const iconMap = {
      grant: 'fas fa-gift',
      accelerator: 'fas fa-rocket',
      vc: 'fas fa-building',
      angel: 'fas fa-user-tie',
      crowdfunding: 'fas fa-users',
      government: 'fas fa-landmark'
    };
    return iconMap[type] || 'fas fa-dollar-sign';
  };

  const getFundingTypeColor = (type: FundingOpportunity['type']) => {
    const colorMap = {
      grant: 'bg-green-100 text-green-800',
      accelerator: 'bg-blue-100 text-blue-800',
      vc: 'bg-purple-100 text-purple-800',
      angel: 'bg-orange-100 text-orange-800',
      crowdfunding: 'bg-pink-100 text-pink-800',
      government: 'bg-indigo-100 text-indigo-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const sortedOpportunities = [...data].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-hand-holding-usd text-purple-600 mr-3"></i>
          8. Funding Opportunities
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Curated funding opportunities matched to your startup profile
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-gray-400 text-2xl"></i>
            </div>
            <p className="text-gray-600">No funding opportunities found for your criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Matches */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-star text-yellow-500 mr-2"></i>
                Top Matches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedOpportunities.slice(0, 4).map((opportunity) => (
                  <Card key={opportunity.id} className="bg-white border-2 hover:border-purple-200 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center">
                            <i className={`${getFundingTypeIcon(opportunity.type)} text-purple-600 mr-2`}></i>
                            {opportunity.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className={getFundingTypeColor(opportunity.type)}>
                              {opportunity.type.toUpperCase()}
                            </Badge>
                            <Badge className={`${getMatchScoreColor(opportunity.matchScore)} px-2 py-1`}>
                              {opportunity.matchScore}% match
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 text-sm">{opportunity.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">Amount:</span>
                          <div className="text-green-600 font-semibold">{opportunity.amount}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Stage:</span>
                          <div className="text-gray-600">{opportunity.stage.join(', ')}</div>
                        </div>
                      </div>

                      {opportunity.applicationDeadline && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Deadline:</span>
                          <div className="text-red-600">
                            {new Date(opportunity.applicationDeadline).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="font-medium text-gray-900 text-sm">Requirements:</span>
                        <ul className="mt-1 space-y-1">
                          {opportunity.requirements.slice(0, 3).map((req, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start">
                              <i className="fas fa-check text-green-500 mr-2 mt-0.5 text-xs"></i>
                              <span>{req}</span>
                            </li>
                          ))}
                          {opportunity.requirements.length > 3 && (
                            <li className="text-xs text-gray-500">
                              +{opportunity.requirements.length - 3} more requirements
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(opportunity.website, '_blank')}
                        >
                          <i className="fas fa-external-link-alt mr-2"></i>
                          Learn More
                        </Button>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-bookmark mr-2"></i>
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Opportunities Table */}
            {sortedOpportunities.length > 4 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Opportunities</h3>
                <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Match</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Deadline</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedOpportunities.slice(4).map((opportunity) => (
                          <tr key={opportunity.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{opportunity.name}</div>
                              <div className="text-sm text-gray-600 truncate max-w-xs">
                                {opportunity.description}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getFundingTypeColor(opportunity.type)}>
                                {opportunity.type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{opportunity.amount}</td>
                            <td className="px-4 py-3">
                              <Badge className={`${getMatchScoreColor(opportunity.matchScore)} text-xs`}>
                                {opportunity.matchScore}%
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {opportunity.applicationDeadline 
                                ? new Date(opportunity.applicationDeadline).toLocaleDateString()
                                : 'Rolling'
                              }
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(opportunity.website, '_blank')}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Funding Tips */}
            <div className="bg-white rounded-lg p-6 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                Funding Application Tips
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
                  <span>Tailor your application to each funding source's specific requirements</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
                  <span>Prepare a compelling pitch deck and financial projections</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
                  <span>Apply early and follow up professionally</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
                  <span>Network with other entrepreneurs and investors in your space</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Summary Badge */}
        <div className="text-center pt-4 border-t border-purple-200">
          <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
            <i className="fas fa-hand-holding-usd mr-2"></i>
            {data.length} Funding Opportunities Identified
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
