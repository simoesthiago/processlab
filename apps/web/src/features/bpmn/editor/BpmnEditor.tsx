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
    hidePalette = true,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<unknown>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Function to create an element at a specific position
    const createElementAtPosition = useCallback((element: DraggedElement, clientX: number, clientY: number) => {
        if (!modelerRef.current || !containerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modeler = modelerRef.current as any;
        const canvas = modeler.get('canvas');
        const elementFactory = modeler.get('elementFactory');
        const modeling = modeler.get('modeling');
        const elementRegistry = modeler.get('elementRegistry');

        // Convert screen coordinates to canvas coordinates.
        // viewbox.x/viewbox.y are already in canvas coords, so we add them after
        // normalizing the mouse position by the current zoom scale.
        const containerRect = containerRef.current.getBoundingClientRect();
        const viewbox = canvas.viewbox();

        const x = viewbox.x + ((clientX - containerRect.left) / viewbox.scale);
        const y = viewbox.y + ((clientY - containerRect.top) / viewbox.scale);

        // Get the process element to append new elements to
        const rootElement = canvas.getRootElement();
        const processElement =
            rootElement?.type === 'bpmn:Process'
                ? rootElement
                : elementRegistry.getAll().find((el: { type?: string }) => el.type === 'bpmn:Process');

        if (!processElement) {
            console.error('Process element not found');
            return;
        }

        let newShape;

        try {
            // Handle different element types
            if (element.type === 'bpmn:SequenceFlow' || element.type === 'bpmn:MessageFlow') {
                // Connections require source and target - can't be dragged directly
                console.warn('Connections must be created between elements');
                return;
            }

            if (element.type === 'bpmn:Participant') {
                // Create a pool/participant
                newShape = elementFactory.createParticipantShape({ type: 'bpmn:Participant' });
            } else if (element.type === 'bpmn:Lane') {
                // Lanes need to be added to an existing pool
                console.warn('Lanes must be added to an existing pool');
                return;
            } else {
                // Create regular shape (task, event, gateway, etc.)
                newShape = elementFactory.createShape({ type: element.type });
            }

            if (newShape) {
                // Create the shape on the canvas
                const parent = element.type === 'bpmn:Participant'
                    ? rootElement
                    : processElement;

                modeling.createShape(newShape, { x, y }, parent);
            }
        } catch (err) {
            console.error('Failed to create element:', err);
        }
    }, []);

    useImperativeHandle(ref, () => ({
        getXml: async () => {
            if (!modelerRef.current) throw new Error("Editor not initialized");
            const modeler = modelerRef.current as { saveXML: (options: { format: boolean }) => Promise<{ xml: string }> };
            const { xml } = await modeler.saveXML({ format: true });
            return xml;
        },
        createElementAtPosition,
    }));

    // Handle drag over
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDraggingOver) {
            setIsDraggingOver(true);
        }
    }, [isDraggingOver]);

    // Handle drag leave
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Only set dragging to false if we're leaving the container entirely
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        const elementData = e.dataTransfer.getData('application/bpmn-element');
        if (!elementData) return;

        try {
            const element: DraggedElement = JSON.parse(elementData);
            createElementAtPosition(element, e.clientX, e.clientY);
        } catch (err) {
            console.error('Failed to parse element data:', err);
        }
    }, [createElementAtPosition]);

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
        if (modelerRef.current && isReady) {
            const modeler = modelerRef.current as { importXML: (xml: string) => Promise<unknown> };

            // If initialXml is provided, use it; otherwise ensure minimal XML is loaded
            const xmlToImport = initialXml || MINIMAL_BPMN_XML;

            modeler.importXML(xmlToImport).catch((err: unknown) => {
                console.error("Failed to import XML:", err);
                setError("Failed to render BPMN diagram");
            });
        }
    }, [initialXml, isReady]);


    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-destructive-50 text-destructive p-4">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div
            className={`relative w-full h-full ${hidePalette ? 'bpmn-editor-hide-palette' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-hide-palette={hidePalette}
        >
            {/* Editor Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ minHeight: '500px' }}
            />

            {/* Drop Zone Indicator */}
            {isDraggingOver && (
                <div className="absolute inset-0 pointer-events-none z-20 border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center">
                    <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-border">
                        <p className="text-sm font-medium text-primary">Drop element here</p>
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
