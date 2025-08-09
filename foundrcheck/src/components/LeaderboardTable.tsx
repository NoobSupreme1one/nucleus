'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScoreBadge } from './ScoreBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/time';
import Link from 'next/link';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardTableProps {
  ideas?: LeaderboardEntry[];
  isLoading?: boolean;
}

export function LeaderboardTable({ ideas = [], isLoading = false }: LeaderboardTableProps) {
  if (isLoading) {
    return <LeaderboardTableSkeleton />;
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No ideas have been scored yet.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Idea</TableHead>
            <TableHead className="w-24">Score</TableHead>
            <TableHead className="w-32">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ideas.map((idea, index) => {
            const ownerName = idea.expand?.owner?.name || idea.expand?.owner?.username || 'Anonymous';
            const ownerInitials = ownerName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow key={idea.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm">
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <Link 
                        href={`/ideas/${idea.id}`}
                        className="font-medium hover:text-primary transition-colors block truncate"
                      >
                        {idea.title}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">
                        by {ownerName}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <ScoreBadge score={idea.score} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelativeTime(idea.created)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function LeaderboardTableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Idea</TableHead>
            <TableHead className="w-24">Score</TableHead>
            <TableHead className="w-32">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="w-8 h-8 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}