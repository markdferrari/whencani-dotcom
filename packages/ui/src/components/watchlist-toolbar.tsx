"use client";

import { Filter, SortAsc, Share2, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Button } from './button';

export interface WatchlistToolbarProps {
  sortBy: 'date-added' | 'release-soonest' | 'release-latest' | 'alphabetical';
  onSortChange: (sortBy: 'date-added' | 'release-soonest' | 'release-latest' | 'alphabetical') => void;
  filterGenre?: string;
  onFilterGenreChange?: (genre: string) => void;
  filterPlatform?: string;
  onFilterPlatformChange?: (platform: string) => void;
  availableGenres: Array<{ id: string; name: string }>;
  availablePlatforms?: Array<{ id: string; name: string }>;
  onExport: (type: 'link' | 'text') => void;
  itemCount: number;
}

const SORT_OPTIONS = [
  { value: 'release-soonest', label: 'Release Date (Soonest)' },
  { value: 'release-latest', label: 'Release Date (Latest)' },
  { value: 'date-added', label: 'Date Added' },
  { value: 'alphabetical', label: 'Alphabetical' },
] as const;

export function WatchlistToolbar({
  sortBy,
  onSortChange,
  filterGenre,
  onFilterGenreChange,
  filterPlatform,
  onFilterPlatformChange,
  availableGenres,
  availablePlatforms,
  onExport,
  itemCount,
}: WatchlistToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-[200px] border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950/70">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genre filter */}
        {onFilterGenreChange && availableGenres.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <Select value={filterGenre || 'all'} onValueChange={(value) => onFilterGenreChange(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full sm:w-[180px] border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950/70">
                <SelectValue placeholder="All genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Platform filter (games only) */}
        {onFilterPlatformChange && availablePlatforms && availablePlatforms.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <Select value={filterPlatform || 'all'} onValueChange={(value) => onFilterPlatformChange(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full sm:w-[180px] border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950/70">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {availablePlatforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Export dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export watchlist</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport('link')}>
              <Share2 className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('text')}>
              <FileText className="mr-2 h-4 w-4" />
              Copy as text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
