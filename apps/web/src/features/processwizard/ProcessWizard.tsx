'use client';

/**
 * Process Wizard Component
 *
 * AI-powered chat interface for natural language BPMN editing.
 * Supports BYOK (Bring Your Own Key) — API key sent per request as a header,
 * never stored in localStorage.
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BPMN_JSON } from '@processlab/shared-schemas';
import { Send, Plus, Wand2, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  error?: boolean;
}

interface ProcessWizardProps {
  bpmn?: BPMN_JSON;
  bpmnXml?: string;
  modelVersionId?: string;
  onEditApplied: (newBpmn: BPMN_JSON, newVersionId: string) => void;
  openAiKey?: string;
}

const SUGGESTIONS = [
  'Create a payment process',
  'Add a review task before approval',
  'Add an error handling subprocess',
  'Insert a time event for deadlines',
];

export default function ProcessWizard({
  bpmnXml,
  modelVersionId,
  onEditApplied,
  openAiKey,
}: ProcessWizardProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const pushMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input.trim();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

    setInput('');
    pushMessage({ role: 'user', content: command });
    setIsLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (openAiKey) headers['X-OpenAI-API-Key'] = openAiKey;

      const res = await fetch(`${apiBase}/api/v1/edit/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bpmn_xml: bpmnXml,
          command,
          model_version_id: modelVersionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || `Error ${res.status}`);
      }

      const data = await res.json();
      if (data.bpmn) {
        onEditApplied(data.bpmn, data.versionId || '');
        const summary = data.changes?.length
          ? `Done! Applied: ${data.changes.join(', ')}.`
          : 'Done! Diagram updated.';
        pushMessage({ role: 'assistant', content: summary });
      } else {
        pushMessage({
          role: 'assistant',
          content: 'The command was processed but no diagram changes were returned.',
          error: true,
        });
      }
    } catch (err: any) {
      pushMessage({
        role: 'assistant',
        content: err?.message || 'Something went wrong. Please try again.',
        error: true,
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    setIsUploading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/ingest/upload`, {
        method: 'POST',
        body: formData,
        // No Content-Type header — browser sets the correct multipart boundary
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      const data = await res.json();
      const fileNames = Array.from(files).map((f) => f.name).join(', ');
      pushMessage({
        role: 'system',
        content: `Uploaded: ${fileNames} ✓  — processing in background`,
      });

      // Store artifact ids for future generate calls (optional future use)
      if (data.uploaded) {
        console.log('[ProcessWizard] Uploaded artifact ids:', data.uploaded.map((u: any) => u.id));
      }
    } catch (err: any) {
      pushMessage({
        role: 'system',
        content: `Upload failed: ${err?.message || 'Unknown error'}`,
        error: true,
      });
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be uploaded again
      e.target.value = '';
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state — show icon + suggestions */
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="h-20 w-20 rounded-full bg-accent/30 flex items-center justify-center border border-accent/40 text-primary mb-4">
              <Wand2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Process Wizard</h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-[280px]">
              Describe how your process works and let the Wizard build it for you
            </p>
            <div className="w-full space-y-2">
              <div className="text-xs text-muted-foreground mb-2 text-left">Try these:</div>
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
        ) : (
          /* Chat messages */
          <div className="flex flex-col gap-3 p-4">
            {messages.map((msg, idx) => {
              if (msg.role === 'system') {
                return (
                  <div
                    key={idx}
                    className={cn(
                      'text-xs text-center px-3 py-1.5 rounded-md mx-auto max-w-[90%]',
                      msg.error
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {msg.content}
                  </div>
                );
              }

              if (msg.role === 'user') {
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm bg-primary text-primary-foreground">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // assistant
              return (
                <div key={idx} className="flex items-start gap-2">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-accent/50 flex items-center justify-center mt-0.5">
                    <Wand2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm',
                      msg.error
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {msg.error && <AlertCircle className="h-3.5 w-3.5 inline mr-1 mb-0.5" />}
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="shrink-0 h-6 w-6 rounded-full bg-accent/50 flex items-center justify-center mt-0.5">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              'p-1.5 rounded-md hover:bg-accent transition-colors shrink-0',
              isUploading
                ? 'text-muted-foreground/50 cursor-wait'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Upload file (PDF, image, Word)"
          >
            <Plus className={cn('h-4 w-4', isUploading && 'animate-spin')} />
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
              'bg-primary text-primary-foreground hover:bg-primary/90',
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
