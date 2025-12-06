'use client';

/**
 * BPMN Elements Sidebar
 * 
 * A sidebar that displays BPMN elements that can be dragged onto the canvas.
 * This separates the element palette from the main canvas area.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Circle, 
  Square, 
  Diamond, 
  ArrowRight,
  Users,
  MessageSquare,
  Clock,
  Database,
  FileText,
  ChevronDown,
  ChevronRight,
  Layers,
  GitBranch,
  CircleDot,
  StopCircle,
} from 'lucide-react';

interface ElementCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  elements: ElementItem[];
}

interface ElementItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: string;
  description?: string;
}

const ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    id: 'events',
    name: 'Events',
    icon: <Circle className="h-4 w-4" />,
    elements: [
      { id: 'start-event', name: 'Start Event', icon: <Circle className="h-5 w-5 text-success" />, type: 'bpmn:StartEvent' },
      { id: 'end-event', name: 'End Event', icon: <StopCircle className="h-5 w-5 text-destructive" />, type: 'bpmn:EndEvent' },
      { id: 'intermediate-event', name: 'Intermediate Event', icon: <CircleDot className="h-5 w-5 text-warning" />, type: 'bpmn:IntermediateThrowEvent' },
      { id: 'timer-event', name: 'Timer Event', icon: <Clock className="h-5 w-5 text-info" />, type: 'bpmn:IntermediateCatchEvent', description: 'Timer' },
      { id: 'message-event', name: 'Message Event', icon: <MessageSquare className="h-5 w-5 text-info" />, type: 'bpmn:IntermediateCatchEvent', description: 'Message' },
    ],
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: <Square className="h-4 w-4" />,
    elements: [
      { id: 'task', name: 'Task', icon: <Square className="h-5 w-5 text-primary" />, type: 'bpmn:Task' },
      { id: 'user-task', name: 'User Task', icon: <Users className="h-5 w-5 text-primary" />, type: 'bpmn:UserTask' },
      { id: 'service-task', name: 'Service Task', icon: <Database className="h-5 w-5 text-primary" />, type: 'bpmn:ServiceTask' },
      { id: 'script-task', name: 'Script Task', icon: <FileText className="h-5 w-5 text-primary" />, type: 'bpmn:ScriptTask' },
      { id: 'subprocess', name: 'Sub Process', icon: <Layers className="h-5 w-5 text-primary" />, type: 'bpmn:SubProcess' },
    ],
  },
  {
    id: 'gateways',
    name: 'Gateways',
    icon: <Diamond className="h-4 w-4" />,
    elements: [
      { id: 'exclusive-gateway', name: 'Exclusive (XOR)', icon: <Diamond className="h-5 w-5 text-warning" />, type: 'bpmn:ExclusiveGateway' },
      { id: 'parallel-gateway', name: 'Parallel (AND)', icon: <GitBranch className="h-5 w-5 text-warning" />, type: 'bpmn:ParallelGateway' },
      { id: 'inclusive-gateway', name: 'Inclusive (OR)', icon: <Diamond className="h-5 w-5 text-warning" />, type: 'bpmn:InclusiveGateway' },
    ],
  },
  {
    id: 'connectors',
    name: 'Connectors',
    icon: <ArrowRight className="h-4 w-4" />,
    elements: [
      { id: 'sequence-flow', name: 'Sequence Flow', icon: <ArrowRight className="h-5 w-5 text-muted-foreground" />, type: 'bpmn:SequenceFlow' },
      { id: 'message-flow', name: 'Message Flow', icon: <MessageSquare className="h-5 w-5 text-muted-foreground" />, type: 'bpmn:MessageFlow' },
    ],
  },
  {
    id: 'swimlanes',
    name: 'Swimlanes',
    icon: <Layers className="h-4 w-4" />,
    elements: [
      { id: 'pool', name: 'Pool', icon: <Square className="h-5 w-5 text-secondary-foreground" />, type: 'bpmn:Participant' },
      { id: 'lane', name: 'Lane', icon: <Layers className="h-5 w-5 text-secondary-foreground" />, type: 'bpmn:Lane' },
    ],
  },
];

interface ElementsSidebarProps {
  onElementDragStart?: (element: ElementItem) => void;
  className?: string;
}

export function ElementsSidebar({ onElementDragStart, className }: ElementsSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['events', 'activities', 'gateways']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = searchQuery
    ? ELEMENT_CATEGORIES.map(category => ({
        ...category,
        elements: category.elements.filter(el =>
          el.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.elements.length > 0)
    : ELEMENT_CATEGORIES;

  const handleDragStart = (e: React.DragEvent, element: ElementItem) => {
    e.dataTransfer.setData('application/bpmn-element', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
    onElementDragStart?.(element);
  };

  return (
    <div className={cn(
      'w-56 bg-card border-r border-border flex flex-col h-full',
      className
    )}>
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground mb-2">Elements</h3>
        <input
          type="text"
          placeholder="Search elements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Element Categories */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map(category => (
          <div key={category.id} className="border-b border-border last:border-b-0">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors text-left"
            >
              {expandedCategories.includes(category.id) ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">{category.icon}</span>
              <span className="text-xs font-medium text-foreground">{category.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {category.elements.length}
              </span>
            </button>

            {/* Elements */}
            {expandedCategories.includes(category.id) && (
              <div className="pb-2">
                {category.elements.map(element => (
                  <div
                    key={element.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, element)}
                    className={cn(
                      'flex items-center gap-2 mx-2 px-2 py-1.5 rounded-md cursor-grab',
                      'hover:bg-accent transition-colors',
                      'active:cursor-grabbing active:bg-accent/80',
                      'border border-transparent hover:border-border'
                    )}
                  >
                    <span className="shrink-0">{element.icon}</span>
                    <span className="text-xs text-foreground truncate">{element.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-border bg-muted/30 shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">
          Drag elements onto the canvas
        </p>
      </div>
    </div>
  );
}

