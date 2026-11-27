import * as React from 'react';
import { cn } from '@/lib/utils';

type SearchChipProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const SearchChip = React.forwardRef<HTMLButtonElement, SearchChipProps>(
  ({ className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn('chip search-chip', className)} {...props} />
  ),
);

SearchChip.displayName = 'SearchChip';
export { SearchChip };
