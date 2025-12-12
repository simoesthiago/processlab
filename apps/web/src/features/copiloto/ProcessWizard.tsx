'use client';

/**
 * Process Wizard Component
 * 
 * Redesigned Process Wizard interface matching the design image.
 * Shows suggestions and input field for natural language process editing.
 */

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BPMN_JSON } from '@processlab/shared-schemas';
import { 
  Send, 
  Plus,
} from 'lucide-react';

interface ProcessWizardProps {
  bpmn?: BPMN_JSON;
  bpmnXml?: string;
  modelVersionId?: string;
  onEditApplied: (newBpmn: BPMN_JSON, newVersionId: string) => void;
}

const SUGGESTIONS = [
  'Create a payment process',
  'Add a review task before the ap...',
  'Add an error handling subprocess',
  'Insert a time event for deadlines',
];

export default function ProcessWizard({ bpmn, bpmnXml, modelVersionId, onEditApplied }: ProcessWizardProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/v1/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bpmn_xml: bpmnXml,
          command,
          model_version_id: modelVersionId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to execute command');
      }

      const data = await res.json();
      if (data.bpmn) {
        onEditApplied(data.bpmn, data.versionId || '');
      } else {
        // If no bpmn returned, try to reload from API
        console.warn('No BPMN returned from edit API');
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          {/* ProcessLab Logo */}
          <div className="mb-0.1">
            <img
              src="/logo_processlab.png"
              alt="ProcessLab Logo"
              className="h-20 w-20 object-contain"
            />
          </div>

          {/* Title and Description */}
          <h3 className="text-xl font-bold text-foreground mb-1">
            Process Wizard
          </h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-[280px]">
            Describe how your process works and let the Wizard build it for you
          </p>

          {/* Suggestions */}
          <div className="w-full space-y-2 mb-6">
            <div className="text-xs text-muted-foreground mb-3 text-left">
              Try these:
            </div>
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-xs',
                  'bg-secondary/50 hover:bg-secondary transition-colors',
                  'border border-border hover:border-primary/30',
                  'text-foreground'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0"
            title="Add"
          >
            <Plus className="h-4 w-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Process Wizard..."
            disabled={isLoading}
            className={cn(
              'flex-1 px-3 py-2 text-sm rounded-md',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'placeholder:text-muted-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              'p-2 rounded-md transition-colors shrink-0',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

