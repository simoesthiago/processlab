'use client';

/**
 * Copilot Interface
 * 
 * Chat-like interface for natural language BPMN editing.
 * Redesigned to match the ProcessLab design system.
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BPMN_JSON } from '@processlab/shared-schemas';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface CopilotProps {
  bpmn?: BPMN_JSON;
  bpmnXml?: string;
  modelVersionId?: string;
  onEditApplied: (newBpmn: BPMN_JSON, newVersionId: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'success' | 'error';
  timestamp: Date;
}

const SUGGESTIONS = [
  'Add a review task before the end event',
  'Create a parallel gateway for approval',
  'Add error handling subprocess',
  'Insert a timer event for deadline',
];

export default function Copilot({ bpmn, bpmnXml, modelVersionId, onEditApplied }: CopilotProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: command,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/v1/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bpmn: bpmn || undefined,
          bpmn_xml: bpmnXml,
          command,
          model_version_id: modelVersionId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to execute command');
      }

      const data = await res.json();

      // Add assistant response
      const changesText = data.changes?.join('\n') || 'Changes applied successfully';
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: changesText,
        status: 'success',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Apply changes
      onEditApplied(data.bpmn, data.versionId);

    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error executing that command. Please try again.',
        status: 'error',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Empty State with Suggestions
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="p-3 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              BPMN Copilot
            </h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-[220px]">
              Describe changes to your process in natural language
            </p>
            
            {/* Suggestions */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <Lightbulb className="h-3 w-3" />
                <span>Try these:</span>
              </div>
              {SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-xs',
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
          // Messages List
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : msg.status === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-secondary text-secondary-foreground'
                )}>
                  {msg.role === 'user' ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  'flex-1 max-w-[85%]'
                )}>
                  <div className={cn(
                    'rounded-xl px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : msg.status === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none'
                      : 'bg-secondary text-secondary-foreground rounded-tl-none'
                  )}>
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                  
                  {/* Status indicator for assistant messages */}
                  {msg.role === 'assistant' && msg.status && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      {msg.status === 'success' ? (
                        <>
                          <CheckCircle className="h-2.5 w-2.5 text-success" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-2.5 w-2.5 text-destructive" />
                          <span>Failed</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-secondary rounded-xl rounded-tl-none px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a change..."
            disabled={isLoading}
            className={cn(
              'flex-1 px-3 py-2 text-sm rounded-lg',
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
              'p-2 rounded-lg transition-colors',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        
        {/* Quick actions hint */}
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Press Enter to send • Natural language commands work best
        </p>
      </div>
    </div>
  );
}
