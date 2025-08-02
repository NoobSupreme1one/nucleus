import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProBusinessReport } from "@shared/types";

interface StartupResourcesSectionProps {
  data: ProBusinessReport['startupResources'];
}

export function StartupResourcesSection({ data }: StartupResourcesSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-green-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-toolbox text-emerald-600 mr-3"></i>
          9. Startup Resources & Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Resources</h3>
            <div className="space-y-2">
              {data.legalResources.map((resource, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-emerald-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{resource.name}</h4>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => window.open(resource.website, '_blank')}>
                      <i className="fas fa-external-link-alt"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Services</h3>
            <div className="space-y-2">
              {data.technicalServices.map((service, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-emerald-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => window.open(service.website, '_blank')}>
                      <i className="fas fa-external-link-alt"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center pt-4 border-t border-emerald-200">
          <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2">
            <i className="fas fa-toolbox mr-2"></i>
            Startup Resources Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
