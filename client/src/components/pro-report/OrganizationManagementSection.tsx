import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProBusinessReport } from "@shared/types";

interface OrganizationManagementSectionProps {
  data: ProBusinessReport['organizationManagement'];
}

export function OrganizationManagementSection({ data }: OrganizationManagementSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-users text-orange-600 mr-3"></i>
          4. Organization & Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizational Structure</h3>
          <p className="text-gray-700">{data.organizationalStructure}</p>
        </div>
        <div className="text-center pt-4 border-t border-orange-200">
          <Badge className="bg-orange-100 text-orange-800 px-4 py-2">
            <i className="fas fa-users mr-2"></i>
            Organization & Management Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
