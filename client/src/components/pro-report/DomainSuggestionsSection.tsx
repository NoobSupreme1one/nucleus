import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DomainSuggestion } from "@shared/types";

interface DomainSuggestionsSectionProps {
  data: DomainSuggestion[];
}

export function DomainSuggestionsSection({ data }: DomainSuggestionsSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-violet-50 to-purple-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-globe text-violet-600 mr-3"></i>
          10. Domain Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((domain, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-violet-200">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{domain.domain}</h4>
                <Badge className={domain.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {domain.available ? 'Available' : 'Taken'}
                </Badge>
              </div>
              {domain.price && (
                <p className="text-sm text-gray-600 mb-2">${domain.price}/year</p>
              )}
              {domain.available && (
                <Button size="sm" className="w-full">
                  Register Domain
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="text-center pt-4 border-t border-violet-200">
          <Badge className="bg-violet-100 text-violet-800 px-4 py-2">
            <i className="fas fa-globe mr-2"></i>
            Domain Suggestions Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
