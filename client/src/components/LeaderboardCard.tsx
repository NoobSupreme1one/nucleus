import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { User } from "@shared/types";

interface LeaderboardCardProps {
  user: User;
  rank: number;
  isTopThree: boolean;
  showFullProfile?: boolean;
}

export default function LeaderboardCard({ user, rank, isTopThree, showFullProfile = true }: LeaderboardCardProps) {
  const roleColors = {
    engineer: "bg-blue-100 text-blue-800",
    designer: "bg-purple-100 text-purple-800",
    marketer: "bg-green-100 text-green-800",
  };

  const rankColors = {
    1: "bg-yellow-500 text-white",
    2: "bg-gray-400 text-white",
    3: "bg-amber-600 text-white",
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return rank.toString();
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isTopThree ? 'ring-2 ring-yellow-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isTopThree ? rankColors[rank as keyof typeof rankColors] : 'bg-gray-200 text-gray-700'
          }`}>
            {getRankIcon(rank)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.email || 'Anonymous User'
                }
              </h3>
              {user.role && (
                <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                  {user.role}
                </Badge>
              )}
            </div>
            {user.location && (
              <p className="text-sm text-gray-500">{user.location}</p>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {user.totalIdeaScore || 0}
            </div>
            <div className="text-xs text-gray-500">idea score</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}