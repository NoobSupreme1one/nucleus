import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/time';
import Link from 'next/link';
import type { LeaderboardEntry } from '@/lib/types';

interface IdeaCardProps {
  idea: LeaderboardEntry;
  showOwner?: boolean;
  className?: string;
}

export function IdeaCard({ idea, showOwner = true, className }: IdeaCardProps) {
  const ownerName = idea.expand?.owner?.name || idea.expand?.owner?.username || 'Anonymous';
  const ownerInitials = ownerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {showOwner && (
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {ownerInitials}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-6 truncate">
                <Link 
                  href={`/ideas/${idea.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {idea.title}
                </Link>
              </CardTitle>
              {showOwner && (
                <p className="text-sm text-muted-foreground truncate">
                  by {ownerName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge 
              variant={idea.score >= 70 ? "default" : idea.score >= 40 ? "secondary" : "outline"}
              className="font-mono"
            >
              {idea.score}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {idea.analysis_summary && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-5 line-clamp-2">
            {idea.analysis_summary}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatRelativeTime(idea.created)}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export function IdeaCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-5 w-10" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}