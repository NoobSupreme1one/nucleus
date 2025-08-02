import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProBusinessReport } from "@shared/types";

interface MarketingSalesSectionProps {
  data: ProBusinessReport['marketingSalesStrategy'];
}

export function MarketingSalesSection({ data }: MarketingSalesSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-pink-50 to-rose-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-bullhorn text-pink-600 mr-3"></i>
          6. Marketing & Sales Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Marketing Strategy</h3>
          <p className="text-gray-700">{data.marketingStrategy}</p>
        </div>
        <div className="text-center pt-4 border-t border-pink-200">
          <Badge className="bg-pink-100 text-pink-800 px-4 py-2">
            <i className="fas fa-bullhorn mr-2"></i>
            Marketing & Sales Strategy Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
