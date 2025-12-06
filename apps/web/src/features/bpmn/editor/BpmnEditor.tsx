/**
 * BPMN Editor Component
 * 
 * Main editor component using bpmn-js for BPMN diagram editing.
 * 
 * Architecture Notes:
 * - Operates on BPMN_JSON internal format (source of truth)
 * - Converts to XML only for visualization/export (cite PRD: 166)
 * - Uses ELK.js for automatic pool/lane layout (cite PRD: 149)
 */

'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

import { BPMN_JSON } from '@processlab/shared-schemas';

// Minimal BPMN XML to initialize an empty diagram
const MINIMAL_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

// Interface for element data from the sidebar
export interface DraggedElement {
    id: string;
    name: string;
    type: string;
    description?: string;
}

export interface BpmnEditorRef {
    getXml: () => Promise<string>;
    createElementAtPosition: (element: DraggedElement, x: number, y: number) => void;
}

interface BpmnEditorProps {
    /** Initial BPMN in JSON format */
    initialBpmn?: BPMN_JSON;
    /** Initial BPMN XML (optional, overrides initialBpmn) */
    initialXml?: string;
    /** Callback when BPMN is modified */
    onChange?: (bpmn: BPMN_JSON) => void;
    /** Read-only mode */
    readOnly?: boolean;
    /** Hide the default bpmn-js palette */
    hidePalette?: boolean;
}

const BpmnEditor = forwardRef<BpmnEditorRef, BpmnEditorProps>(({
    initialBpmn,
    initialXml,
    onChange,
    readOnly = false,
    hidePalette = false,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<unknown>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Function to create an element at a specific position
    const createElementAtPosition = useCallback((element: DraggedElement, clientX: number, clientY: number) => {
        if (!modelerRef.current || !containerRef.current) {
            console.error('[BpmnEditor] Modeler or container not ready');
            return;
        }

        if (!isReady) {
            console.error('[BpmnEditor] Modeler not initialized yet');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modeler = modelerRef.current as any;
        
        try {
            const canvas = modeler.get('canvas');
            const elementFactory = modeler.get('elementFactory');
            const modeling = modeler.get('modeling');
            const elementRegistry = modeler.get('elementRegistry');

            if (!canvas || !elementFactory || !modeling || !elementRegistry) {
                console.error('[BpmnEditor] Required services not available', { canvas: !!canvas, elementFactory: !!elementFactory, modeling: !!modeling, elementRegistry: !!elementRegistry });
                return;
            }

            // Convert screen coordinates to canvas coordinates.
            // viewbox.x/viewbox.y are already in canvas coords, so we add them after
            // normalizing the mouse position by the current zoom scale.
            const containerRect = containerRef.current.getBoundingClientRect();
            const viewbox = canvas.viewbox();

            const x = viewbox.x + ((clientX - containerRect.left) / viewbox.scale);
            const y = viewbox.y + ((clientY - containerRect.top) / viewbox.scale);

            console.log('[BpmnEditor] Creating element', { element, x, y, viewbox, scale: viewbox.scale });

            // Get the process element to append new elements to
            const rootElement = canvas.getRootElement();
            const processElement =
                rootElement?.type === 'bpmn:Process'
                    ? rootElement
                    : elementRegistry.getAll().find((el: { type?: string }) => el.type === 'bpmn:Process');

            if (!processElement) {
                console.error('[BpmnEditor] Process element not found. Root element:', rootElement);
                return;
            }

            console.log('[BpmnEditor] Process element found:', processElement.id);

            let newShape;

            // Handle different element types
            if (element.type === 'bpmn:SequenceFlow' || element.type === 'bpmn:MessageFlow') {
                // Connections require source and target - can't be dragged directly
                console.warn('[BpmnEditor] Connections must be created between elements');
                return;
            }

            if (element.type === 'bpmn:Participant') {
                // Create a pool/participant
                newShape = elementFactory.createParticipantShape({ type: 'bpmn:Participant' });
            } else if (element.type === 'bpmn:Lane') {
                // Lanes need to be added to an existing pool
                console.warn('[BpmnEditor] Lanes must be added to an existing pool');
                return;
            } else if (element.type === 'bpmn:IntermediateCatchEvent' && element.description) {
                // Intermediate catch events with specific types (Timer, Message, etc.)
                // Create the base event first
                newShape = elementFactory.createShape({ type: element.type });
                // The specific event type (timer, message) will be set via modeling after creation
            } else {
                // Create regular shape (task, event, gateway, etc.)
                newShape = elementFactory.createShape({ type: element.type });
            }

            if (!newShape) {
                console.error('[BpmnEditor] Failed to create shape for type:', element.type);
                return;
            }

            console.log('[BpmnEditor] Shape created:', newShape.id, newShape.type);

            // Create the shape on the canvas
            const parent = element.type === 'bpmn:Participant'
                ? rootElement
                : processElement;

            const createdShape = modeling.createShape(newShape, { x, y }, parent);
            
            if (createdShape) {
                console.log('[BpmnEditor] Element successfully created on canvas:', createdShape.id);
                
                // For intermediate catch events with specific types, update the event definition
                if (element.type === 'bpmn:IntermediateCatchEvent' && element.description) {
                    try {
                        const bpmnFactory = modeler.get('bpmnFactory');
                        const eventDefinitions = [];
                        
                        if (element.description.toLowerCase() === 'timer') {
                            eventDefinitions.push(bpmnFactory.create('bpmn:TimerEventDefinition'));
                        } else if (element.description.toLowerCase() === 'message') {
                            eventDefinitions.push(bpmnFactory.create('bpmn:MessageEventDefinition'));
                        }
                        
                        if (eventDefinitions.length > 0) {
                            modeling.updateProperties(createdShape, {
                                eventDefinitions: eventDefinitions
                            });
                            console.log('[BpmnEditor] Event definition added:', element.description);
                        }
                    } catch (err) {
                        console.warn('[BpmnEditor] Failed to add event definition:', err);
                    }
                }
                
                // Ensure the element is visible by centering the viewport if needed
                canvas.zoom('fit-viewport', 'auto');
            } else {
                console.error('[BpmnEditor] Failed to create shape on canvas');
            }
        } catch (err) {
            console.error('[BpmnEditor] Failed to create element:', err);
            if (err instanceof Error) {
                console.error('[BpmnEditor] Error details:', err.message, err.stack);
            }
        }
    }, [isReady]);

    useImperativeHandle(ref, () => ({
        getXml: async () => {
            if (!modelerRef.current) throw new Error("Editor not initialized");
            const modeler = modelerRef.current as { saveXML: (options: { format: boolean }) => Promise<{ xml: string }> };
            const { xml } = await modeler.saveXML({ format: true });
            return xml;
        },
        createElementAtPosition,
    }));

    useEffect(() => {
        let modeler: unknown;

        const initModeler = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const BpmnModeler = (await import('bpmn-js/lib/Modeler')).default;

                if (!containerRef.current) return;

                modeler = new BpmnModeler({
                    container: containerRef.current,
                    keyboard: {
                        bindTo: document
                    }
                });

                // Hide the default palette if hidePalette is true
                const hidePaletteElement = () => {
                    if (!hidePalette) return;

                    const palette = containerRef.current?.querySelector('.djs-palette');
                    if (palette) {
                        (palette as HTMLElement).style.display = 'none';
                    }
                };

                // Try immediately and also after a delay to catch late rendering
                hidePaletteElement();
                setTimeout(hidePaletteElement, 100);
                setTimeout(hidePaletteElement, 500);

                // Use MutationObserver to catch when palette is added to DOM
                if (containerRef.current) {
                    const observer = new MutationObserver(() => {
                        hidePaletteElement();
                    });
                    observer.observe(containerRef.current, {
                        childList: true,
                        subtree: true
                    });
                    // Store observer for cleanup
                    (modeler as { _paletteObserver?: MutationObserver })._paletteObserver = observer;
                }

                modelerRef.current = modeler;
                
                // Import minimal XML to ensure modeler is ready
                const xmlToImport = initialXml || MINIMAL_BPMN_XML;
                await modeler.importXML(xmlToImport);
                
                console.log('[BpmnEditor] Modeler initialized and XML imported');
                setIsReady(true);

            } catch (err: unknown) {
                console.error("Failed to initialize BPMN modeler:", err);
                const errorMessage = err instanceof Error ? err.message : "Failed to initialize BPMN modeler";
                setError(errorMessage);
            }
        };

        if (!modelerRef.current) {
            initModeler();
        }

        return () => {
            if (modeler) {
                const modelerTyped = modeler as { destroy: () => void; _paletteObserver?: MutationObserver };
                if (modelerTyped._paletteObserver) {
                    modelerTyped._paletteObserver.disconnect();
                }
                modelerTyped.destroy();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidePalette]);

    useEffect(() => {
        if (modelerRef.current && isReady && initialXml) {
            // Only re-import if initialXml changes and is different from what's already loaded
            const modeler = modelerRef.current as { importXML: (xml: string) => Promise<unknown> };
            
            modeler.importXML(initialXml).catch((err: unknown) => {
                console.error("[BpmnEditor] Failed to import XML:", err);
                setError("Failed to render BPMN diagram");
            });
        }
    }, [initialXml, isReady]);


    // Global drag detection to show overlay
    useEffect(() => {
        const handleGlobalDragEnter = (e: DragEvent) => {
            // Check if it's a BPMN element being dragged
            if (e.dataTransfer?.types.includes('application/bpmn-element')) {
                setIsDraggingOver(true);
            }
        };

        const handleGlobalDragEnd = () => {
            setIsDraggingOver(false);
        };

        document.addEventListener('dragenter', handleGlobalDragEnter);
        document.addEventListener('dragend', handleGlobalDragEnd);

        return () => {
            document.removeEventListener('dragenter', handleGlobalDragEnter);
            document.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-destructive-50 text-destructive p-4">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div
            ref={wrapperRef}
            className={`relative w-full h-full ${hidePalette ? 'bpmn-editor-hide-palette' : ''}`}
            data-hide-palette={hidePalette}
        >
            {/* Editor Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ minHeight: '500px' }}
            />

            {/* Transparent Drop Zone Overlay - appears when dragging BPMN elements */}
            {isDraggingOver && (
                <div
                    className="absolute inset-0 z-30 pointer-events-auto"
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDragLeave={(e) => {
                        // Only hide if actually leaving the wrapper
                        const rect = wrapperRef.current?.getBoundingClientRect();
                        if (rect) {
                            const { clientX, clientY } = e;
                            if (
                                clientX < rect.left ||
                                clientX > rect.right ||
                                clientY < rect.top ||
                                clientY > rect.bottom
                            ) {
                                setIsDraggingOver(false);
                            }
                        }
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingOver(false);

                        const elementData = e.dataTransfer.getData('application/bpmn-element');
                        if (!elementData) {
                            console.warn('[BpmnEditor] No element data in drop event');
                            return;
                        }

                        try {
                            const element: DraggedElement = JSON.parse(elementData);
                            console.log('[BpmnEditor] Drop event received:', element, { x: e.clientX, y: e.clientY });
                            createElementAtPosition(element, e.clientX, e.clientY);
                        } catch (err) {
                            console.error('[BpmnEditor] Failed to parse element data:', err);
                        }
                    }}
                >
                    {/* Visual indicator */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center">
                        <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-border">
                            <p className="text-sm font-medium text-primary">Drop element here</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading BPMN Editor...</p>
                    </div>
                </div>
            )}
        </div>
    );
});

export default BpmnEditor;

