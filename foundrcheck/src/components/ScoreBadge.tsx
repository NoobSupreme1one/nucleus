import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const getVariant = (score: number) => {
    if (score >= 80) return 'default'; // High score - green
    if (score >= 60) return 'secondary'; // Medium score - blue
    if (score >= 40) return 'outline'; // Low score - gray
    return 'destructive'; // Very low score - red
  };

  const getLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Badge variant={getVariant(score)} className="font-mono text-sm px-3 py-1">
        {score}
      </Badge>
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {getLabel(score)}
      </span>
    </div>
  );
}