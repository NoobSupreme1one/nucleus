import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { User } from "@shared/schema";

interface ProfileCardProps {
  user: User;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const roleColors = {
    engineer: "bg-blue-100 text-blue-800",
    designer: "bg-purple-100 text-purple-800",
    marketer: "bg-green-100 text-green-800",
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-600 relative">
        {user.profileImageUrl ? (
          <img 
            src={user.profileImageUrl} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-white absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 object-cover"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
            <i className="fas fa-user text-gray-600 text-2xl"></i>
          </div>
        )}
      </div>
      
      <CardContent className="pt-16 pb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || 'Anonymous User'
          }
        </h2>
        
        {user.role && (
          <Badge className={`mb-3 ${roleColors[user.role as keyof typeof roleColors]}`}>
            {user.role}
          </Badge>
        )}
        
        {user.location && (
          <p className="text-gray-600 mb-3">
            <i className="fas fa-map-marker-alt mr-1"></i>
            {user.location}
          </p>
        )}
        
        {user.bio && (
          <p className="text-gray-700 mb-4 text-sm leading-relaxed">
            {user.bio}
          </p>
        )}
        
        <div className="flex justify-center items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {user.totalIdeaScore || 0}
            </div>
            <div className="text-xs text-gray-500">idea score</div>
          </div>
          
          {user.profileViews !== null && user.profileViews !== undefined && (
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {user.profileViews}
              </div>
              <div className="text-xs text-gray-500">profile views</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}