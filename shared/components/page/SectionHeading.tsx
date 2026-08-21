import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  description: string;
  className?: string;
}

export function SectionHeading({ title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn('ui-section-intro', className)}>
      <h2 className="ui-section-title ui-safe-text">{title}</h2>
      <p className="ui-body ui-safe-text ui-pretty text-muted-foreground">{description}</p>
    </div>
  );
}
