'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', className }: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-9"
      />
    </div>
  );
}

// Hook para filtrar folders e processos
export function useSearchFilter<T extends { name: string; description?: string | null }>(
  items: T[],
  searchQuery: string
): T[] {
  return useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
  }, [items, searchQuery]);
}

