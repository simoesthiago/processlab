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

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
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

export interface BpmnEditorRef {
    getXml: () => Promise<string>;
    /** Get SVG representation of the diagram */
    getSvg: () => Promise<string>;
    /** Get selected elements */
    getSelectedElements: () => any[];
    /** Apply formatting to selected elements */
    applyFormatting: (format: {
        color?: string;
        fillColor?: string;
        font?: string;
        fontSize?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        textColor?: string;
        textAlign?: 'left' | 'center' | 'right';
        verticalAlign?: 'top' | 'middle' | 'bottom';
    }) => void;
    /** Undo last action */
    undo: () => void;
    /** Redo last action */
    redo: () => void;
    /** Check if undo is available */
    canUndo: () => boolean;
    /** Check if redo is available */
    canRedo: () => boolean;
    /** Delete selected elements */
    deleteSelected: () => void;
    /** Select all elements */
    selectAll: () => void;
    /** Copy selected elements */
    copy: () => void;
    /** Paste elements */
    paste: () => void;
    /** Duplicate selected elements */
    duplicate: () => void;
    /** Zoom in */
    zoomIn: () => void;
    /** Zoom out */
    zoomOut: () => void;
    /** Reset zoom */
    zoomReset: () => void;
    /** Get current zoom level */
    getZoom: () => number;
    /** Set zoom level */
    setZoom: (zoom: number) => void;
    /** Bring selected elements to front */
    bringToFront: () => void;
    /** Send selected elements to back */
    sendToBack: () => void;
    /** Group selected elements */
    groupElements: () => void;
    /** Ungroup selected elements */
    ungroupElements: () => void;
    /** Align selected elements */
    alignElements: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
    /** Distribute selected elements evenly */
    distributeElements: (direction: 'horizontal' | 'vertical') => void;
    /** Apply editor settings */
    applySettings: (settings: {
        gridSnap?: boolean;
        gridSize?: number;
        zoomMin?: number;
        zoomMax?: number;
    }) => void;
}

interface BpmnEditorProps {
    /** Initial BPMN in JSON format */
    initialBpmn?: BPMN_JSON;
    /** Initial BPMN XML (optional, overrides initialBpmn) */
    initialXml?: string;
    /** Callback when BPMN is modified */
    onChange?: (bpmn: BPMN_JSON) => void;
    /** Callback when selection changes */
    onSelectionChange?: (elements: any[]) => void;
    /** Read-only mode */
    readOnly?: boolean;
}

const BpmnEditor = forwardRef<BpmnEditorRef, BpmnEditorProps>(({
    initialBpmn,
    initialXml,
    onChange,
    onSelectionChange,
    readOnly = false,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Editor settings state
    const [editorSettings, setEditorSettings] = useState({
        gridSnap: true,
        gridSize: 20,
        zoomMin: 20,
        zoomMax: 300,
    });

    useImperativeHandle(ref, () => ({
        getXml: async () => {
            if (!modelerRef.current) throw new Error("Editor not initialized");
            const modeler = modelerRef.current;
            const { xml } = await modeler.saveXML({ format: true });
            console.log('[BpmnEditor] getXml called, returning XML length:', xml.length);
            return xml;
        },
        getSelectedElements: () => {
            if (!modelerRef.current) return [];
            const selection = modelerRef.current.get('selection');
            return selection.get() || [];
        },
        applyFormatting: (format) => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length === 0) return;

            selectedElements.forEach((element: any) => {
                const updates: any = {};

                // Color (stroke)
                if (format.color !== undefined) {
                    modeling.setColor(element, { stroke: format.color });
                }

                // Fill Color
                if (format.fillColor !== undefined) {
                    modeling.setColor(element, { fill: format.fillColor });
                }

                // Text Color - Update label style
                if (format.textColor !== undefined) {
                    // Update text color via modeling.setColor for labels
                    const label = element.labels && element.labels[0];
                    if (label) {
                        modeling.setColor(label, { stroke: format.textColor });
                    }
                    // Also update di:FontColor property
                    updates['di:FontColor'] = format.textColor;
                }

                // Font
                if (format.font !== undefined) {
                    updates['di:FontName'] = format.font;
                }

                // Font Size
                if (format.fontSize !== undefined) {
                    updates['di:FontSize'] = format.fontSize;
                }

                // Bold
                if (format.bold !== undefined) {
                    updates['di:FontWeight'] = format.bold ? 'bold' : 'normal';
                }

                // Italic
                if (format.italic !== undefined) {
                    updates['di:FontStyle'] = format.italic ? 'italic' : 'normal';
                }

                // Underline
                if (format.underline !== undefined) {
                    updates['di:TextDecoration'] = format.underline ? 'underline' : 'none';
                }

                // Text Align
                if (format.textAlign !== undefined) {
                    updates['di:TextAlign'] = format.textAlign;
                }

                // Vertical Align
                if (format.verticalAlign !== undefined) {
                    const verticalAlignMap: Record<string, string> = {
                        'top': 'top',
                        'middle': 'middle',
                        'bottom': 'bottom'
                    };
                    updates['di:VerticalAlign'] = verticalAlignMap[format.verticalAlign] || format.verticalAlign;
                }

                if (Object.keys(updates).length > 0) {
                    modeling.updateProperties(element, updates);
                }
            });
        },
        undo: () => {
            if (!modelerRef.current) return;
            const commandStack = modelerRef.current.get('commandStack');
            if (commandStack.canUndo()) {
                commandStack.undo();
            }
        },
        redo: () => {
            if (!modelerRef.current) return;
            const commandStack = modelerRef.current.get('commandStack');
            if (commandStack.canRedo()) {
                commandStack.redo();
            }
        },
        canUndo: () => {
            if (!modelerRef.current) return false;
            const commandStack = modelerRef.current.get('commandStack');
            return commandStack.canUndo();
        },
        canRedo: () => {
            if (!modelerRef.current) return false;
            const commandStack = modelerRef.current.get('commandStack');
            return commandStack.canRedo();
        },
        deleteSelected: () => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length === 0) return;
            
            // Filter out root elements
            const elementsToDelete = selectedElements.filter((element: any) => {
                const bo = element.businessObject;
                return bo && bo.$type !== 'bpmn:Process' && bo.$type !== 'bpmn:Collaboration';
            });
            
            if (elementsToDelete.length > 0) {
                modeling.removeElements(elementsToDelete);
            }
        },
        selectAll: () => {
            if (!modelerRef.current) return;
            const elementRegistry = modelerRef.current.get('elementRegistry');
            const selection = modelerRef.current.get('selection');
            
            const allElements = elementRegistry.getAll().filter((element: any) => {
                // Filter out root elements and connections (we can include connections if needed)
                return element.type !== 'bpmn:Process' && 
                       element.type !== 'bpmn:Collaboration' &&
                       element.type !== 'bpmndi:BPMNPlane' &&
                       element.type !== 'bpmndi:BPMNDiagram';
            });
            
            selection.select(allElements);
        },
        copy: () => {
            if (!modelerRef.current) return;
            const copyPaste = modelerRef.current.get('copyPaste', false);
            if (copyPaste) {
                copyPaste.copy();
            } else {
                // Fallback: store in clipboard manually
                const selection = modelerRef.current.get('selection');
                const selectedElements = selection.get();
                if (selectedElements.length > 0) {
                    // Store in sessionStorage as fallback
                    const elementsData = selectedElements.map((el: any) => ({
                        id: el.id,
                        type: el.type,
                        businessObject: el.businessObject
                    }));
                    sessionStorage.setItem('bpmn-copied-elements', JSON.stringify(elementsData));
                }
            }
        },
        paste: () => {
            if (!modelerRef.current) return;
            const copyPaste = modelerRef.current.get('copyPaste', false);
            if (copyPaste) {
                copyPaste.paste();
            } else {
                // Fallback: try to restore from sessionStorage
                const copiedData = sessionStorage.getItem('bpmn-copied-elements');
                if (copiedData) {
                    console.warn('Copy/paste fallback: Full implementation requires copyPaste module');
                }
            }
        },
        duplicate: () => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const elementFactory = modelerRef.current.get('elementFactory');
            const create = modelerRef.current.get('create');
            const canvas = modelerRef.current.get('canvas');
            
            const selectedElements = selection.get();
            if (selectedElements.length === 0) return;
            
            // For now, duplicate the first selected element
            const element = selectedElements[0];
            const bo = element.businessObject;
            
            // Create new element with same type
            const newElement = elementFactory.createShape({
                type: bo.$type,
                x: element.x + 50,
                y: element.y + 50
            });
            
            create.start(canvas.getRootElement(), newElement, {
                x: element.x + 50,
                y: element.y + 50
            });
        },
        zoomIn: () => {
            if (!modelerRef.current) return;
            const canvas = modelerRef.current.get('canvas');
            const currentZoom = canvas.zoom();
            const maxZoom = editorSettings.zoomMax / 100;
            canvas.zoom(Math.min(currentZoom * 1.2, maxZoom));
        },
        zoomOut: () => {
            if (!modelerRef.current) return;
            const canvas = modelerRef.current.get('canvas');
            const currentZoom = canvas.zoom();
            const minZoom = editorSettings.zoomMin / 100;
            canvas.zoom(Math.max(currentZoom / 1.2, minZoom));
        },
        zoomReset: () => {
            if (!modelerRef.current) return;
            const canvas = modelerRef.current.get('canvas');
            canvas.zoom('fit-viewport', 'auto');
        },
        getZoom: () => {
            if (!modelerRef.current) return 1;
            const canvas = modelerRef.current.get('canvas');
            return Math.round(canvas.zoom() * 100);
        },
        setZoom: (zoom: number) => {
            if (!modelerRef.current) return;
            const canvas = modelerRef.current.get('canvas');
            const minZoom = editorSettings.zoomMin / 100;
            const maxZoom = editorSettings.zoomMax / 100;
            const zoomValue = zoom / 100;
            canvas.zoom(Math.max(minZoom, Math.min(zoomValue, maxZoom)));
        },
        applySettings: (settings: {
            gridSnap?: boolean;
            gridSize?: number;
            zoomMin?: number;
            zoomMax?: number;
        }) => {
            setEditorSettings((prev) => ({ ...prev, ...settings }));
        },
        bringToFront: () => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length === 0) return;
            
            // Bring elements to front by moving them slightly and back
            // This forces them to be rendered on top
            selectedElements.forEach((element: any) => {
                const currentPos = { x: element.x, y: element.y };
                // Move slightly to trigger re-render
                modeling.moveShape(element, { x: currentPos.x + 0.1, y: currentPos.y });
                modeling.moveShape(element, currentPos);
            });
        },
        sendToBack: () => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length === 0) return;
            
            // Note: bpmn-js doesn't have a direct sendToBack API
            // This is a simplified implementation
            // For proper z-order management, we'd need to manipulate the DOM order
            console.log('Send to back:', selectedElements);
            // TODO: Implement proper sendToBack using DOM manipulation if needed
        },
        groupElements: () => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length < 2) return;
            
            // Group elements (simplified - bpmn-js doesn't have native grouping, so we'll use a workaround)
            // For BPMN, grouping is typically done via subprocesses or lanes
            // This is a placeholder that could be enhanced later
            console.log('Group elements:', selectedElements);
            // TODO: Implement proper grouping logic
        },
        ungroupElements: () => {
            if (!modelerRef.current) return;
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length === 0) return;
            
            // Ungroup elements
            console.log('Ungroup elements:', selectedElements);
            // TODO: Implement proper ungrouping logic
        },
        alignElements: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length < 2) return;
            
            const canvas = modelerRef.current.get('canvas');
            
            // Get bounding boxes for all selected elements
            const bboxes = selectedElements.map((element: any) => {
                return canvas.getAbsoluteBBox(element);
            });
            
            // Calculate alignment value based on direction
            if (direction === 'left') {
                const alignValue = Math.min(...bboxes.map(b => b.x));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaX = alignValue - bbox.x;
                    modeling.moveShape(element, { x: element.x + deltaX, y: element.y });
                });
            } else if (direction === 'right') {
                const alignValue = Math.max(...bboxes.map(b => b.x + b.width));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaX = alignValue - (bbox.x + bbox.width);
                    modeling.moveShape(element, { x: element.x + deltaX, y: element.y });
                });
            } else if (direction === 'center') {
                const alignValue = bboxes.reduce((sum, b) => sum + b.x + b.width / 2, 0) / bboxes.length;
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaX = alignValue - (bbox.x + bbox.width / 2);
                    modeling.moveShape(element, { x: element.x + deltaX, y: element.y });
                });
            } else if (direction === 'top') {
                const alignValue = Math.min(...bboxes.map(b => b.y));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaY = alignValue - bbox.y;
                    modeling.moveShape(element, { x: element.x, y: element.y + deltaY });
                });
            } else if (direction === 'bottom') {
                const alignValue = Math.max(...bboxes.map(b => b.y + b.height));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaY = alignValue - (bbox.y + bbox.height);
                    modeling.moveShape(element, { x: element.x, y: element.y + deltaY });
                });
            } else if (direction === 'middle') {
                const alignValue = bboxes.reduce((sum, b) => sum + b.y + b.height / 2, 0) / bboxes.length;
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaY = alignValue - (bbox.y + bbox.height / 2);
                    modeling.moveShape(element, { x: element.x, y: element.y + deltaY });
                });
            }
        },
        distributeElements: (direction: 'horizontal' | 'vertical') => {
            if (!modelerRef.current) return;
            const modeling = modelerRef.current.get('modeling');
            const selection = modelerRef.current.get('selection');
            const selectedElements = selection.get();
            
            if (selectedElements.length < 3) return; // Need at least 3 elements to distribute
            
            const canvas = modelerRef.current.get('canvas');
            
            // Get bounding boxes for all selected elements
            const bboxes = selectedElements.map((element: any) => {
                return canvas.getAbsoluteBBox(element);
            });
            
            if (direction === 'horizontal') {
                // Sort by x position
                const sorted = selectedElements
                    .map((element: any, index: number) => ({ element, bbox: bboxes[index] }))
                    .sort((a, b) => a.bbox.x - b.bbox.x);
                
                // Calculate total width and spacing
                const leftmost = sorted[0].bbox.x;
                const rightmost = sorted[sorted.length - 1].bbox.x + sorted[sorted.length - 1].bbox.width;
                const totalWidth = rightmost - leftmost;
                const totalElementWidth = sorted.reduce((sum, item) => sum + item.bbox.width, 0);
                const spacing = (totalWidth - totalElementWidth) / (sorted.length - 1);
                
                // Distribute elements evenly
                let currentX = leftmost;
                sorted.forEach((item, index) => {
                    if (index > 0) {
                        const deltaX = currentX - item.bbox.x;
                        modeling.moveShape(item.element, { x: item.element.x + deltaX, y: item.element.y });
                    }
                    currentX += item.bbox.width + spacing;
                });
            } else if (direction === 'vertical') {
                // Sort by y position
                const sorted = selectedElements
                    .map((element: any, index: number) => ({ element, bbox: bboxes[index] }))
                    .sort((a, b) => a.bbox.y - b.bbox.y);
                
                // Calculate total height and spacing
                const topmost = sorted[0].bbox.y;
                const bottommost = sorted[sorted.length - 1].bbox.y + sorted[sorted.length - 1].bbox.height;
                const totalHeight = bottommost - topmost;
                const totalElementHeight = sorted.reduce((sum, item) => sum + item.bbox.height, 0);
                const spacing = (totalHeight - totalElementHeight) / (sorted.length - 1);
                
                // Distribute elements evenly
                let currentY = topmost;
                sorted.forEach((item, index) => {
                    if (index > 0) {
                        const deltaY = currentY - item.bbox.y;
                        modeling.moveShape(item.element, { x: item.element.x, y: item.element.y + deltaY });
                    }
                    currentY += item.bbox.height + spacing;
                });
            }
        },
        searchElements: (query: string) => {
            if (!modelerRef.current) return [];
            const elementRegistry = modelerRef.current.get('elementRegistry');
            const allElements = elementRegistry.getAll();
            
            const lowerQuery = query.toLowerCase();
            const results: Array<{ element: any; name: string; type: string; id: string }> = [];
            
            allElements.forEach((element: any) => {
                const bo = element.businessObject;
                if (!bo) return;
                
                // Filter out root elements
                if (bo.$type === 'bpmn:Process' || bo.$type === 'bpmn:Collaboration' || 
                    bo.$type === 'bpmndi:BPMNPlane' || bo.$type === 'bpmndi:BPMNDiagram') {
                    return;
                }
                
                const name = bo.name || bo.id || '';
                const type = bo.$type || '';
                const id = bo.id || '';
                
                // Search in name, id, or type
                if (name.toLowerCase().includes(lowerQuery) ||
                    id.toLowerCase().includes(lowerQuery) ||
                    type.toLowerCase().includes(lowerQuery)) {
                    results.push({ element, name, type, id });
                }
            });
            
            return results;
        },
        navigateToElement: (elementId: string) => {
            if (!modelerRef.current) return;
            const elementRegistry = modelerRef.current.get('elementRegistry');
            const canvas = modelerRef.current.get('canvas');
            const selection = modelerRef.current.get('selection');
            
            const element = elementRegistry.get(elementId);
            if (!element) return;
            
            // Select element
            selection.select(element);
            
            // Zoom and scroll to element
            canvas.zoom('fit-viewport', 'auto');
            canvas.scrollToElement(element, { top: 100, left: 100 });
        },
    }));

    useEffect(() => {
        let modeler: unknown;

        const initModeler = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const BpmnModeler = (await import('bpmn-js/lib/Modeler')).default;
                const CustomElementFactory = (await import('./custom/CustomElementFactory')).default;

                if (!containerRef.current) return;

                modeler = new BpmnModeler({
                    container: containerRef.current,
                    keyboard: {
                        bindTo: document
                    },
                    additionalModules: [
                        {
                            elementFactory: ['type', CustomElementFactory]
                        }
                    ]
                });

                modelerRef.current = modeler;

                // Listen to selection changes
                const selection = modeler.get('selection');
                const eventBus = modeler.get('eventBus');
                
                eventBus.on('selection.changed', () => {
                    const selectedElements = selection.get();
                    if (onSelectionChange) {
                        onSelectionChange(selectedElements);
                    }
                });

                // Listen to command stack changes (for undo/redo state)
                const commandStack = modeler.get('commandStack');
                eventBus.on('commandStack.changed', () => {
                    // Trigger re-render if needed (could be used to update undo/redo button states)
                    // For now, we'll handle this via the ref methods
                });

                // Note: Keyboard shortcuts for Delete/Backspace are handled in StudioContent.tsx
                // to avoid conflicts with bpmn-js keyboard API

                // Enhanced drag & drop handling
                const canvas = modeler.get('canvas');
                const elementFactory = modeler.get('elementFactory');
                const create = modeler.get('create');

                // Handle drop events from ElementsSidebar
                const handleDrop = (event: DragEvent) => {
                    event.preventDefault();
                    event.stopPropagation();

                    const dragData = event.dataTransfer?.getData('application/bpmn-element');
                    if (!dragData) return;

                    try {
                        const elementData = JSON.parse(dragData);
                        const canvasElement = canvas.getRootElement();
                        
                        // Get drop position relative to canvas
                        const canvasRect = (event.target as HTMLElement)?.closest('.djs-container')?.getBoundingClientRect();
                        if (!canvasRect) return;
                        
                        const x = event.clientX - canvasRect.left;
                        const y = event.clientY - canvasRect.top;
                        
                        // Convert to canvas coordinates
                        const position = canvas.getPosition({ x, y });
                        
                        // Apply snap to grid (if enabled)
                        let snappedX = position.x;
                        let snappedY = position.y;
                        if (editorSettings.gridSnap) {
                            snappedX = Math.round(position.x / editorSettings.gridSize) * editorSettings.gridSize;
                            snappedY = Math.round(position.y / editorSettings.gridSize) * editorSettings.gridSize;
                        }

                        // Create element shape
                        const shape = elementFactory.createShape({
                            type: elementData.type
                        });

                        // Start creation at snapped position
                        create.start(event, shape, {
                            x: snappedX,
                            y: snappedY
                        });
                    } catch (err) {
                        console.error('Failed to handle drop:', err);
                    }
                };

                // Add drop handlers to canvas after it's ready
                setTimeout(() => {
                    const canvasElement = containerRef.current?.querySelector('.djs-container');
                    if (canvasElement) {
                        canvasElement.addEventListener('dragover', (e: Event) => {
                            e.preventDefault();
                            const dragEvent = e as DragEvent;
                            if (dragEvent.dataTransfer) {
                                dragEvent.dataTransfer.dropEffect = 'copy';
                            }
                        });
                        canvasElement.addEventListener('drop', handleDrop);
                    }
                }, 100);

                // Listen to create events for visual feedback
                eventBus.on('create.start', () => {
                    const canvasElement = containerRef.current?.querySelector('.bpmn-editor-container');
                    canvasElement?.classList.add('dragging-element');
                });

                eventBus.on('create.end', () => {
                    const canvasElement = containerRef.current?.querySelector('.bpmn-editor-container');
                    canvasElement?.classList.remove('dragging-element');
                });

                // Import minimal XML to ensure modeler is ready
                const xmlToImport = initialXml || MINIMAL_BPMN_XML;
                console.log('[BpmnEditor] Initializing with XML length:', xmlToImport.length);
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
                (modeler as { destroy: () => void }).destroy();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (modelerRef.current && isReady && initialXml) {
            // Only re-import if initialXml changes and is different from what's already loaded
            const modeler = modelerRef.current as { importXML: (xml: string) => Promise<unknown> };
            console.log('[BpmnEditor] Re-importing XML length:', initialXml.length);
            modeler.importXML(initialXml).catch((err: unknown) => {
                console.error("[BpmnEditor] Failed to import XML:", err);
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
            ref={wrapperRef}
            className="relative w-full h-full"
        >
            {/* Editor Container */}
            <div
                ref={containerRef}
                className="w-full h-full bpmn-editor-container"
                style={{ minHeight: '500px' }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }}
            />

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
