import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FounderMatch } from "@shared/types";

interface FounderMatchingSectionProps {
  data: FounderMatch[];
}

export function FounderMatchingSection({ data }: FounderMatchingSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-handshake text-amber-600 mr-3"></i>
          11. Founder Matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((match, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-amber-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {match.user.firstName} {match.user.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">{match.user.role}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-800">
                  {match.matchScore}% match
                </Badge>
              </div>
              <p className="text-sm text-gray-700 mb-3">{match.user.bio}</p>
              <div className="flex space-x-2">
                <Button size="sm" disabled={!match.contactAllowed}>
                  {match.contactAllowed ? 'Contact' : 'Private'}
                </Button>
                <Button size="sm" variant="outline">
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center pt-4 border-t border-amber-200">
          <Badge className="bg-amber-100 text-amber-800 px-4 py-2">
            <i className="fas fa-handshake mr-2"></i>
            Founder Matching Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
