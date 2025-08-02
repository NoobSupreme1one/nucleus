import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProBusinessReport } from "@shared/types";

interface ProductServiceSectionProps {
  data: ProBusinessReport['productServiceLine'];
}

export function ProductServiceSection({ data }: ProductServiceSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-cyan-50 to-blue-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-box text-cyan-600 mr-3"></i>
          5. Product/Service Line
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Description</h3>
          <p className="text-gray-700">{data.productDescription}</p>
        </div>
        <div className="text-center pt-4 border-t border-cyan-200">
          <Badge className="bg-cyan-100 text-cyan-800 px-4 py-2">
            <i className="fas fa-box mr-2"></i>
            Product/Service Line Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
