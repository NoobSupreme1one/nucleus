import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProBusinessReport } from "@shared/types";

interface CompanyDescriptionSectionProps {
  data: ProBusinessReport['companyDescription'];
}

export function CompanyDescriptionSection({ data }: CompanyDescriptionSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-building text-indigo-600 mr-3"></i>
          2. Company Description
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Model</h3>
          <p className="text-gray-700 leading-relaxed">{data.businessModel}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Value Proposition</h3>
          <p className="text-gray-700 leading-relaxed">{data.valueProposition}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Competitive Advantages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.competitiveAdvantages.map((advantage, index) => (
              <div key={index} className="flex items-start bg-white rounded-lg p-3 border border-indigo-200">
                <i className="fas fa-star text-indigo-500 mr-3 mt-1"></i>
                <span className="text-gray-700">{advantage}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <h4 className="font-semibold text-gray-900 mb-2">Business Structure</h4>
            <p className="text-gray-700">{data.businessStructure}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <h4 className="font-semibold text-gray-900 mb-2">Ownership Structure</h4>
            <p className="text-gray-700">{data.ownershipStructure}</p>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-indigo-200">
          <Badge className="bg-indigo-100 text-indigo-800 px-4 py-2">
            <i className="fas fa-building mr-2"></i>
            Company Description Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
