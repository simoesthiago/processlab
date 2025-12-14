'use client';

/**
 * BPMN Elements Sidebar
 * 
 * A sidebar that displays BPMN elements that can be dragged onto the canvas.
 * This separates the element palette from the main canvas area.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DraggedElement } from './editor/BpmnEditor';
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
  elements: SidebarElement[];
}

// Extended element with icon for display
interface SidebarElement extends DraggedElement {
  icon: React.ReactNode;
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
  onElementDragStart?: (element: DraggedElement) => void;
  className?: string;
}

export function ElementsSidebar({ onElementDragStart, className }: ElementsSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['events', 'activities', 'gateways']);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('[ElementsSidebar] expandedCategories:', expandedCategories);

  const toggleCategory = (categoryId: string) => {
    console.log('[ElementsSidebar] toggleCategory called with:', categoryId);
    setExpandedCategories(prev => {
      const next = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      console.log('[ElementsSidebar] new expandedCategories:', next);
      return next;
    });
  };

  const filteredCategories = searchQuery
    ? ELEMENT_CATEGORIES.map(category => ({
        ...category,
        elements: category.elements.filter(el =>
          el.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.elements.length > 0)
    : ELEMENT_CATEGORIES;

  const handleDragStart = (e: React.DragEvent, element: SidebarElement) => {
    // Only pass the essential data (without the React icon)
    const dragData: DraggedElement = {
      id: element.id,
      name: element.name,
      type: element.type,
      description: element.description,
    };
    e.dataTransfer.setData('application/bpmn-element', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    onElementDragStart?.(dragData);
  };

  return (
    <div className={cn(
      'w-14 bg-card border-r border-border flex flex-col items-center py-2 h-full',
      className
    )}>
      {/* Toolbox - Vertical Icon Layout */}
      <div className="flex flex-col items-center gap-1 w-full">
        {/* Pointer Tool (Selected by default) */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors'
          )}
          title="Select"
        >
          <ArrowRight className="h-4 w-4 rotate-45" />
        </button>

        {/* Resize/Move Tool */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Resize/Move"
        >
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-1 h-1 bg-current" />
            <div className="w-1 h-1 bg-current" />
            <div className="w-1 h-1 bg-current" />
            <div className="w-1 h-1 bg-current" />
          </div>
        </button>

        {/* Align Tool */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Align"
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-3 h-0.5 bg-current" />
            <div className="w-3 h-0.5 bg-current" />
            <div className="w-3 h-0.5 bg-current" />
          </div>
        </button>

        {/* Connector Tool */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Connector"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="h-px w-8 bg-border my-1" />

        {/* Events */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Start Event"
        >
          <Circle className="h-5 w-5 text-success" />
        </button>
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Intermediate Event"
        >
          <CircleDot className="h-5 w-5 text-warning" />
        </button>
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="End Event"
        >
          <StopCircle className="h-5 w-5 text-destructive" />
        </button>

        {/* Gateway */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Gateway"
        >
          <Diamond className="h-5 w-5 text-warning" />
        </button>

        {/* Task */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Task"
        >
          <Square className="h-5 w-5 text-primary" />
        </button>

        {/* Document */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Document"
        >
          <FileText className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Data Store */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Data Store"
        >
          <Database className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Pool/Lane */}
        <button
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
          title="Pool/Lane"
        >
          <div className="relative">
            <Square className="h-5 w-5 text-secondary-foreground" />
            <Square className="h-3 w-3 text-secondary-foreground absolute top-0.5 left-0.5" />
          </div>
        </button>
      </div>
    </div>
  );
}

