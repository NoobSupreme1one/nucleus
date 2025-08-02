import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProBusinessReport } from "@shared/types";

interface MarketAnalysisSectionProps {
  data: ProBusinessReport['enhancedMarketAnalysis'];
}

export function MarketAnalysisSection({ data }: MarketAnalysisSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-teal-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-chart-pie text-green-600 mr-3"></i>
          3. Enhanced Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2">Market Size</h4>
            <p className="text-gray-700">{data.marketSize}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2">Growth Rate</h4>
            <p className="text-gray-700">{data.marketGrowthRate}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Target Market Segments</h3>
          <div className="flex flex-wrap gap-2">
            {data.targetMarketSegments.map((segment, index) => (
              <Badge key={index} className="bg-green-100 text-green-800">
                {segment}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Personas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.customerPersonas.map((persona, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-2">{persona.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{persona.demographics}</p>
                <div className="text-sm">
                  <strong>Pain Points:</strong>
                  <ul className="mt-1 space-y-1">
                    {persona.painPoints.map((pain, idx) => (
                      <li key={idx} className="text-gray-600">• {pain}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-4 border-t border-green-200">
          <Badge className="bg-green-100 text-green-800 px-4 py-2">
            <i className="fas fa-chart-pie mr-2"></i>
            Market Analysis Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
