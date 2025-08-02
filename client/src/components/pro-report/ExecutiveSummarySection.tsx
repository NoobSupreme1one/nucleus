import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProBusinessReport } from "@shared/types";

interface ExecutiveSummarySectionProps {
  data: ProBusinessReport['executiveSummary'];
}

export function ExecutiveSummarySection({ data }: ExecutiveSummarySectionProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-chart-line text-blue-600 mr-3"></i>
          1. Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Overview</h3>
          <p className="text-gray-700 leading-relaxed">{data.businessOverview}</p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <i className="fas fa-bullseye text-blue-500 mr-2"></i>
              Mission Statement
            </h4>
            <p className="text-gray-700 text-sm">{data.missionStatement}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <i className="fas fa-eye text-blue-500 mr-2"></i>
              Vision Statement
            </h4>
            <p className="text-gray-700 text-sm">{data.visionStatement}</p>
          </div>
        </div>

        {/* Key Success Factors */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Success Factors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.keySuccessFactors.map((factor, index) => (
              <div key={index} className="flex items-start bg-white rounded-lg p-3 border border-blue-200">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                </div>
                <span className="text-gray-700 text-sm">{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Highlights */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Investment Highlights</h3>
          <div className="space-y-3">
            {data.investmentHighlights.map((highlight, index) => (
              <div key={index} className="flex items-start bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <i className="fas fa-dollar-sign text-green-600 text-sm"></i>
                </div>
                <div>
                  <span className="text-gray-800 font-medium">{highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Badge */}
        <div className="text-center pt-4 border-t border-blue-200">
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
            <i className="fas fa-lightbulb mr-2"></i>
            Executive Summary Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
