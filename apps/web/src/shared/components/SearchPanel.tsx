'use client';

/**
 * Search Panel Component
 * 
 * Panel for searching elements in the BPMN diagram.
 * Allows searching by name, ID, or type and navigating to found elements.
 */

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, ChevronRight, Workflow } from 'lucide-react';
import { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';

interface SearchPanelProps {
  editorRef?: React.RefObject<BpmnEditorRef>;
  onClose?: () => void;
}

interface SearchResult {
  element: any;
  name: string;
  type: string;
  id: string;
}

export default function SearchPanel({ editorRef, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    if (editorRef?.current) {
      const searchResults = editorRef.current.searchElements(query);
      setResults(searchResults);
      setSelectedIndex(0);
    }
  }, [query, editorRef]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleNavigateToResult(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose]);

  const handleNavigateToResult = (result: SearchResult) => {
    if (editorRef?.current) {
      editorRef.current.navigateToElement(result.id);
    }
  };

  const getTypeLabel = (type: string) => {
    // Extract readable type name from BPMN type
    const typeMap: Record<string, string> = {
      'bpmn:Task': 'Task',
      'bpmn:UserTask': 'User Task',
      'bpmn:ServiceTask': 'Service Task',
      'bpmn:ScriptTask': 'Script Task',
      'bpmn:SendTask': 'Send Task',
      'bpmn:ReceiveTask': 'Receive Task',
      'bpmn:ManualTask': 'Manual Task',
      'bpmn:BusinessRuleTask': 'Business Rule Task',
      'bpmn:ExclusiveGateway': 'Exclusive Gateway',
      'bpmn:InclusiveGateway': 'Inclusive Gateway',
      'bpmn:ParallelGateway': 'Parallel Gateway',
      'bpmn:EventBasedGateway': 'Event Gateway',
      'bpmn:StartEvent': 'Start Event',
      'bpmn:EndEvent': 'End Event',
      'bpmn:IntermediateThrowEvent': 'Intermediate Event',
      'bpmn:IntermediateCatchEvent': 'Intermediate Event',
      'bpmn:SequenceFlow': 'Sequence Flow',
      'bpmn:SubProcess': 'Sub Process',
    };

    return typeMap[type] || type.replace('bpmn:', '').replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">Search Elements</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, or type..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query.trim() === '' ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="p-3 rounded-full bg-muted mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Search Elements
            </h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Enter a search term to find elements in the diagram
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="p-3 rounded-full bg-muted mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No Results Found
            </h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleNavigateToResult(result)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left',
                  selectedIndex === index
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border hover:border-border hover:bg-accent/30'
                )}
              >
                <div className="p-1.5 rounded bg-muted">
                  <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {result.name || result.id}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {getTypeLabel(result.type)}
                    </span>
                    <span className="text-xs text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {result.id}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {query.trim() !== '' && results.length > 0 && (
        <div className="px-4 py-2 border-t border-border shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Use ↑↓ to navigate, Enter to go to element</span>
            <span>{selectedIndex + 1} / {results.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

