'use client';

/**
 * Citations Panel
 * 
 * Displays evidence/citations for selected BPMN elements.
 * Updated to match ProcessLab design system.
 */

import { FileText, Link2, ExternalLink, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Citation {
  id: string;
  title: string;
  source: string;
  excerpt: string;
  confidence: number;
  url?: string;
}

// Placeholder citations for demonstration
const PLACEHOLDER_CITATIONS: Citation[] = [];

export default function Citations() {
  const citations = PLACEHOLDER_CITATIONS;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {citations.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="p-3 rounded-full bg-muted mb-4">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Evidence & Citations
            </h3>
            <p className="text-xs text-muted-foreground max-w-[200px] mb-4">
              Select an element to view supporting evidence and document citations
            </p>
            <div className="w-full max-w-[200px] p-3 rounded-lg border border-dashed border-border bg-muted/30">
              <p className="text-[10px] text-muted-foreground">
                Citations show the original documents and evidence that support each element in your process model
              </p>
            </div>
          </div>
        ) : (
          // Citations List
          <div className="p-4 space-y-3">
            {citations.map((citation) => (
              <div
                key={citation.id}
                className={cn(
                  'p-3 rounded-lg border border-border',
                  'bg-card hover:bg-accent/30 transition-colors',
                  'cursor-pointer'
                )}
              >
                {/* Citation Header */}
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {citation.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {citation.source}
                    </p>
                  </div>
                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>

                {/* Excerpt */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  "{citation.excerpt}"
                </p>

                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        citation.confidence >= 0.8 ? 'bg-success' :
                        citation.confidence >= 0.5 ? 'bg-warning' : 'bg-destructive'
                      )}
                      style={{ width: `${citation.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(citation.confidence * 100)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Link2 className="h-3 w-3" />
          <span>Citations are extracted from uploaded documents</span>
        </div>
      </div>
    </div>
  );
}
