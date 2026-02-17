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
    createElement: (type: string, position: { x: number; y: number }) => Promise<void>;
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
        /** Optional explicit targets (e.g., from toolbar selection mirror) */
        targets?: any[];
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
    /** Automatically layout the diagram using ELK.js */
    autoLayout: () => Promise<void>;
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
    const lastSelectionRef = useRef<any[]>([]);
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
            
            // Get the element registry to check if there are any elements
            const elementRegistry = modeler.get('elementRegistry');
            const allElements = elementRegistry.getAll();
            console.log('[BpmnEditor] getXml called, element count:', allElements.length);
            
            // Filter out root and connection elements to count actual BPMN elements
            const bpmnElements = allElements.filter((el: any) => {
                const bo = el.businessObject;
                return bo && bo.$type && !bo.$type.includes('di:') && bo.$type !== 'bpmn:Process';
            });
            console.log('[BpmnEditor] BPMN elements found:', bpmnElements.length);
            
            const { xml } = await modeler.saveXML({ format: true });
            console.log('[BpmnEditor] getXml returning XML length:', xml.length);
            console.log('[BpmnEditor] XML contains elements:', {
                hasTasks: xml.includes('task'),
                hasEvents: xml.includes('event'),
                hasGateways: xml.includes('gateway'),
                hasSequenceFlows: xml.includes('sequenceFlow'),
                hasShapes: xml.includes('BPMNShape'),
                hasEdges: xml.includes('BPMNEdge'),
                elementCount: bpmnElements.length
            });
            return xml;
        },
        getSvg: async () => {
            if (!modelerRef.current) throw new Error("Editor not initialized");
            const modeler = modelerRef.current;
            const { svg } = await modeler.saveSVG({ format: true });
            return svg;
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
            const elementRegistry = modelerRef.current.get('elementRegistry');
            const eventBus = modelerRef.current.get('eventBus');
            const { targets, ...formatPayload } = format || {};
            const selectionFromModeler = selection.get() || [];
            const selectedElements =
                (targets && targets.length ? targets : selectionFromModeler).length > 0
                    ? targets && targets.length ? targets : selectionFromModeler
                    : lastSelectionRef.current || [];

            if (selectedElements.length === 0) return;

            const alignToTextAnchor: Record<'left' | 'center' | 'right', string> = {
                left: 'start',
                center: 'middle',
                right: 'end',
            };

            const mergeDefined = (base: Record<string, any>, override: Record<string, any>) => {
                const result = { ...base };
                Object.entries(override).forEach(([key, value]) => {
                    if (value !== undefined) {
                        (result as any)[key] = value;
                    }
                });
                return result;
            };

            const getStoredFormatting = (element: any) => {
                const di = element?.di;
                const attrs = di?.$attrs || {};
                return {
                    font: attrs['data-font-family'] || di?.FontName,
                    fontSize: attrs['data-font-size'] || di?.FontSize,
                    bold: (attrs['data-font-weight'] || di?.FontWeight) === 'bold',
                    italic: (attrs['data-font-style'] || di?.FontStyle) === 'italic',
                    underline: (attrs['data-text-decoration'] || di?.TextDecoration) === 'underline',
                    textColor: attrs['data-font-color'] || di?.FontColor,
                    textAlign: (attrs['data-text-align'] || di?.TextAlign) as 'left' | 'center' | 'right' | undefined,
                };
            };

            const persistFormatting = (element: any, fmt: typeof formatPayload) => {
                if (!element?.di) return;
                const attrs = element.di.$attrs || (element.di.$attrs = {});
                const diUpdates: Record<string, any> = {};

                if (fmt.font !== undefined) {
                    attrs['data-font-family'] = fmt.font;
                    diUpdates.FontName = fmt.font;
                }
                if (fmt.fontSize !== undefined) {
                    attrs['data-font-size'] = fmt.fontSize;
                    diUpdates.FontSize = fmt.fontSize;
                }
                if (fmt.bold !== undefined) {
                    const val = fmt.bold ? 'bold' : 'normal';
                    attrs['data-font-weight'] = val;
                    diUpdates.FontWeight = val;
                }
                if (fmt.italic !== undefined) {
                    const val = fmt.italic ? 'italic' : 'normal';
                    attrs['data-font-style'] = val;
                    diUpdates.FontStyle = val;
                }
                if (fmt.underline !== undefined) {
                    const val = fmt.underline ? 'underline' : 'none';
                    attrs['data-text-decoration'] = val;
                    diUpdates.TextDecoration = val;
                }
                if (fmt.textColor !== undefined) {
                    attrs['data-font-color'] = fmt.textColor;
                    diUpdates.FontColor = fmt.textColor;
                }
                if (fmt.textAlign !== undefined) {
                    attrs['data-text-align'] = fmt.textAlign;
                    diUpdates.TextAlign = fmt.textAlign;
                }

                // Push DI changes through modeling so the command stack and renderer know about them
                if (Object.keys(diUpdates).length > 0) {
                    modeling.updateProperties(element, { di: diUpdates });
                }
            };

            const applyTextFormatting = (element: any, gfx?: SVGElement, overrides?: typeof formatPayload) => {
                if (!element) return;
                const registry = elementRegistry;
                const graphics = gfx || registry.getGraphics(element);
                const stored = getStoredFormatting(element);
                const merged = mergeDefined(stored, overrides || {});

                const normalizeFontSize = (size: any) => {
                    if (size === undefined) return undefined;
                    const num = Number(size);
                    return Number.isFinite(num) ? num : undefined;
                };

                const fontSizeValue = normalizeFontSize(merged.fontSize);

                const findTextNodes = (el: any) => {
                    const svgNodes: SVGTextElement[] = [];
                    const htmlNodes: HTMLElement[] = [];
                    const labelNodes: SVGTextElement[] = [];
                    if (el) {
                        const g = registry.getGraphics(el);
                        if (g) {
                            g.querySelectorAll('text, tspan').forEach((n: any) => svgNodes.push(n));
                            g.querySelectorAll('.djs-label').forEach((n: any) => labelNodes.push(n));
                        }
                        const id = el.id || el.businessObject?.id;
                        if (id) {
                            // element itself
                            document
                                .querySelectorAll(`[data-element-id="${id}"] text, [data-element-id="${id}"] tspan`)
                                .forEach((n) => svgNodes.push(n as SVGTextElement));
                            document
                                .querySelectorAll(`[data-element-id="${id}"] .djs-label`)
                                .forEach((n) => labelNodes.push(n as SVGTextElement));
                            // typical external label id pattern: <elementId>_label
                            const labelId = `${id}_label`;
                            document
                                .querySelectorAll(`[data-element-id="${labelId}"] text, [data-element-id="${labelId}"] tspan`)
                                .forEach((n) => svgNodes.push(n as SVGTextElement));
                            document
                                .querySelectorAll(`[data-element-id="${labelId}"] .djs-label`)
                                .forEach((n) => labelNodes.push(n as SVGTextElement));
                            // Direct editing overlays (contenteditable div)
                            document
                                .querySelectorAll(
                                    `[data-element-id="${id}"] .djs-direct-editing-content, .djs-direct-editing-content`
                                )
                                .forEach((n) => htmlNodes.push(n as HTMLElement));
                        }
                    }
                    return { svgNodes, htmlNodes, labelNodes };
                };

                const applyTo = (el: any) => {
                    if (!el) return;
                    const { svgNodes, htmlNodes, labelNodes } = findTextNodes(el);
                    svgNodes.forEach((textNode) => {
                        if (merged.font !== undefined) {
                            textNode.setAttribute('font-family', merged.font);
                            (textNode as any).style.fontFamily = merged.font;
                        }
                        if (merged.fontSize !== undefined) {
                            const sizeToUse = fontSizeValue ?? merged.fontSize;
                            textNode.setAttribute('font-size', `${sizeToUse}`);
                            (textNode as any).style.fontSize = `${sizeToUse}px`;
                        }
                        if (merged.bold !== undefined) {
                            const weight = merged.bold ? 'bold' : 'normal';
                            textNode.setAttribute('font-weight', weight);
                            (textNode as any).style.fontWeight = weight;
                        }
                        if (merged.italic !== undefined) {
                            const style = merged.italic ? 'italic' : 'normal';
                            textNode.setAttribute('font-style', style);
                            (textNode as any).style.fontStyle = style;
                        }
                        if (merged.underline !== undefined) {
                            (textNode as any).style.textDecoration = merged.underline ? 'underline' : 'none';
                        }
                        if (merged.textColor !== undefined) {
                            textNode.setAttribute('fill', merged.textColor);
                            (textNode as any).style.fill = merged.textColor;
                            (textNode as any).style.color = merged.textColor;
                        }
                        if (merged.textAlign !== undefined) {
                            const key = merged.textAlign as keyof typeof alignToTextAnchor;
                            const textAnchor = alignToTextAnchor[key] || 'start';
                            textNode.setAttribute('text-anchor', textAnchor);
                            (textNode as any).style.textAnchor = textAnchor;
                            (textNode as any).style.textAlign = merged.textAlign;
                        }
                    });
                    htmlNodes.forEach((node) => {
                        if (merged.font !== undefined) node.style.fontFamily = merged.font;
                        if (merged.fontSize !== undefined) node.style.fontSize = `${fontSizeValue ?? merged.fontSize}px`;
                        if (merged.bold !== undefined) node.style.fontWeight = merged.bold ? '700' : '400';
                        if (merged.italic !== undefined) node.style.fontStyle = merged.italic ? 'italic' : 'normal';
                        if (merged.underline !== undefined)
                            node.style.textDecoration = merged.underline ? 'underline' : 'none';
                        if (merged.textColor !== undefined) node.style.color = merged.textColor;
                        if (merged.textAlign !== undefined) node.style.textAlign = merged.textAlign;
                    });
                    labelNodes.forEach((node) => {
                        if (merged.font !== undefined) (node as any).style.fontFamily = merged.font;
                        if (merged.fontSize !== undefined)
                            (node as any).style.fontSize = `${fontSizeValue ?? merged.fontSize}px`;
                        if (merged.bold !== undefined) (node as any).style.fontWeight = merged.bold ? 'bold' : 'normal';
                        if (merged.italic !== undefined) (node as any).style.fontStyle = merged.italic ? 'italic' : 'normal';
                        if (merged.underline !== undefined)
                            (node as any).style.textDecoration = merged.underline ? 'underline' : 'none';
                        if (merged.textColor !== undefined) (node as any).style.color = merged.textColor;
                        if (merged.textAlign !== undefined) (node as any).style.textAlign = merged.textAlign;
                    });
                };

                applyTo(element);
                applyTo(element.label);
                if (element.labels && Array.isArray(element.labels)) {
                    element.labels.forEach(applyTo);
                }
                if (element.labelTarget) {
                    applyTo(element.labelTarget);
                }
            };

            const changedElements: any[] = [];

            const uniqById = (elements: any[]) => {
                const seen = new Set<string>();
                return elements.filter((el) => {
                    const id = el?.id || el?.businessObject?.id;
                    if (!id) return true;
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                });
            };

            selectedElements.forEach((element: any) => {
                const labelById = element?.id ? elementRegistry.get?.(`${element.id}_label`) : null;
                const labelsByRelation =
                    elementRegistry?.getAll?.().filter((el: any) => el?.labelTarget === element) || [];
                const labelCandidates = [
                    element,
                    element.label,
                    labelById,
                    ...(element.labels || []),
                    element.labelTarget,
                    ...labelsByRelation,
                ].filter(Boolean);
                const targets = uniqById(labelCandidates);
                // Helper to update any text nodes found for element and its label
                const applyToTextNodes = (el: any) => applyTextFormatting(el, undefined, formatPayload);

                // Color (stroke)
                if (format.color !== undefined) {
                    modeling.setColor(element, { stroke: format.color });
                }

                // Fill Color
                if (format.fillColor !== undefined) {
                    modeling.setColor(element, { fill: format.fillColor });
                }

                changedElements.push(...targets);

                // Apply to text nodes immediately
                targets.forEach((t) => applyToTextNodes(t));

                // Label color via modeling API (stroke + fill) so it persists
                // Persist intended properties on DI via custom attrs + di:* for each target
                targets.forEach((t: any) => persistFormatting(t, format));
            });

            // Notify renderer to refresh (including labels)
            if (changedElements.length > 0) {
                eventBus.fire('elements.changed', { elements: changedElements });
            }
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
            const bboxes: Array<{ x: number; y: number; width: number; height: number }> = selectedElements.map((element: any) => {
                const bb = canvas.getAbsoluteBBox(element);
                return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
            });

            // Calculate alignment value based on direction
            if (direction === 'left') {
                const alignValue = Math.min(...bboxes.map((b) => b.x));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaX = alignValue - bbox.x;
                    modeling.moveShape(element, { x: element.x + deltaX, y: element.y });
                });
            } else if (direction === 'right') {
                const alignValue = Math.max(...bboxes.map((b) => b.x + b.width));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaX = alignValue - (bbox.x + bbox.width);
                    modeling.moveShape(element, { x: element.x + deltaX, y: element.y });
                });
            } else if (direction === 'center') {
                const alignValue = bboxes.reduce((sum: number, b: { x: number; width: number }) => sum + b.x + b.width / 2, 0) / bboxes.length;
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaX = alignValue - (bbox.x + bbox.width / 2);
                    modeling.moveShape(element, { x: element.x + deltaX, y: element.y });
                });
            } else if (direction === 'top') {
                const alignValue = Math.min(...bboxes.map((b) => b.y));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaY = alignValue - bbox.y;
                    modeling.moveShape(element, { x: element.x, y: element.y + deltaY });
                });
            } else if (direction === 'bottom') {
                const alignValue = Math.max(...bboxes.map((b) => b.y + b.height));
                selectedElements.forEach((element: any, index: number) => {
                    const bbox = bboxes[index];
                    const deltaY = alignValue - (bbox.y + bbox.height);
                    modeling.moveShape(element, { x: element.x, y: element.y + deltaY });
                });
            } else if (direction === 'middle') {
                const alignValue = bboxes.reduce((sum: number, b: { y: number; height: number }) => sum + b.y + b.height / 2, 0) / bboxes.length;
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
            const bboxes: Array<{ x: number; y: number; width: number; height: number }> = selectedElements.map((element: any) => {
                const bb = canvas.getAbsoluteBBox(element);
                return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
            });

            if (direction === 'horizontal') {
                // Sort by x position
                const sorted = selectedElements
                    .map((element: any, index: number) => ({ element, bbox: bboxes[index] }))
                    .sort((a: { bbox: { x: number } }, b: { bbox: { x: number } }) => a.bbox.x - b.bbox.x);

                // Calculate total width and spacing
                const leftmost = sorted[0].bbox.x;
                const rightmost = sorted[sorted.length - 1].bbox.x + sorted[sorted.length - 1].bbox.width;
                const totalWidth = rightmost - leftmost;
                const totalElementWidth = sorted.reduce((sum: number, item: { bbox: { width: number } }) => sum + item.bbox.width, 0);
                const spacing = (totalWidth - totalElementWidth) / (sorted.length - 1);

                // Distribute elements evenly
                let currentX = leftmost;
                sorted.forEach((item: { element: any; bbox: { x: number; width: number } }, index: number) => {
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
                    .sort((a: { bbox: { y: number } }, b: { bbox: { y: number } }) => a.bbox.y - b.bbox.y);

                // Calculate total height and spacing
                const topmost = sorted[0].bbox.y;
                const bottommost = sorted[sorted.length - 1].bbox.y + sorted[sorted.length - 1].bbox.height;
                const totalHeight = bottommost - topmost;
                const totalElementHeight = sorted.reduce((sum: number, item: { bbox: { height: number } }) => sum + item.bbox.height, 0);
                const spacing = (totalHeight - totalElementHeight) / (sorted.length - 1);

                // Distribute elements evenly
                let currentY = topmost;
                sorted.forEach((item: { element: any; bbox: { y: number; height: number } }, index: number) => {
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
        autoLayout: async () => {
            if (!modelerRef.current || !isReady) return;
            try {
                const elementRegistry = modelerRef.current.get('elementRegistry');
                const modeling = modelerRef.current.get('modeling');
                const canvas = modelerRef.current.get('canvas');

                const allElements = elementRegistry.getAll();
                const shapes: any[] = allElements.filter((el: any) => {
                    const bo = el.businessObject;
                    return (
                        bo && bo.$type &&
                        bo.$type !== 'bpmn:Process' &&
                        bo.$type !== 'bpmn:Collaboration' &&
                        !bo.$type.includes('SequenceFlow') &&
                        !bo.$type.includes('MessageFlow') &&
                        el.waypoints === undefined
                    );
                });

                if (shapes.length < 2) return;

                const ELK = (await import('elkjs/lib/elk.bundled.js')).default;
                const elk = new ELK();

                const elkGraph = {
                    id: 'root',
                    layoutOptions: {
                        'elk.algorithm': 'layered',
                        'elk.direction': 'RIGHT',
                        'elk.spacing.nodeNode': '60',
                        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                    },
                    children: shapes.map((s: any) => ({
                        id: s.id,
                        width: s.width || 100,
                        height: s.height || 80,
                    })),
                    edges: allElements
                        .filter((el: any) => el.waypoints !== undefined && el.source && el.target)
                        .map((conn: any) => ({
                            id: conn.id,
                            sources: [conn.source.id],
                            targets: [conn.target.id],
                        })),
                };

                const laid = await elk.layout(elkGraph);

                laid.children?.forEach((node: any) => {
                    const el = elementRegistry.get(node.id);
                    if (!el) return;
                    const dx = node.x - el.x;
                    const dy = node.y - el.y;
                    if (dx !== 0 || dy !== 0) {
                        modeling.moveShape(el, { x: dx, y: dy });
                    }
                });

                canvas.zoom('fit-viewport', 'auto');
            } catch (err) {
                console.warn('[BpmnEditor] autoLayout failed:', err);
            }
        },
                createElement: async (type: string, position: { x: number; y: number }) => {
            if (!modelerRef.current || !isReady) {
                throw new Error("Editor not initialized");
            }
            const modeler = modelerRef.current;
            const modeling = modeler.get('modeling');
            const elementFactory = modeler.get('elementFactory');
            const canvas = modeler.get('canvas');
            const rootElement = canvas.getRootElement();

            console.log('[BpmnEditor] createElement called:', { type, position });

            // Create the element shape
            const shape = elementFactory.createShape({
                type: type,
                x: position.x,
                y: position.y
            });

            console.log('[BpmnEditor] Shape created:', shape);

            // Append shape to root element using modeling service
            modeling.appendShape(rootElement, shape, {
                x: position.x,
                y: position.y
            }, rootElement);

            console.log('[BpmnEditor] Element created successfully:', type);
            
            // Verify element was added
            const elementRegistry = modeler.get('elementRegistry');
            const allElements = elementRegistry.getAll();
            console.log('[BpmnEditor] Total elements after creation:', allElements.length);
        },
    }));

    useEffect(() => {
        let modeler: any;

        const initModeler = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const BpmnModeler = (await import('bpmn-js/lib/Modeler')).default;
                const CustomElementFactory = (await import('./custom/CustomElementFactory')).default;
                const CustomRenderer = (await import('./custom/CustomRenderer')).default;

                if (!containerRef.current) return;

                modeler = new BpmnModeler({
                    container: containerRef.current,
                    keyboard: {
                        bindTo: document
                    },
                    additionalModules: [
                        {
                            elementFactory: ['type', CustomElementFactory],
                            __init__: ['customRenderer'],
                            customRenderer: ['type', CustomRenderer]
                        }
                    ]
                });

                modelerRef.current = modeler;

                // Import minimal XML to ensure modeler is ready
                const xmlToImport = initialXml || MINIMAL_BPMN_XML;
                console.log('[BpmnEditor] Initializing with XML length:', xmlToImport.length);
                await modeler.importXML(xmlToImport);
                
                console.log('[BpmnEditor] XML imported, setting up drop handlers...');

                // Setup drag and drop handler for custom sidebar elements
                // Wait a bit for the canvas to be fully rendered
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const canvas = modeler.get('canvas');
                // Try multiple ways to access the canvas container
                const canvasElement = (canvas as any)._container || 
                                    (canvas as any)._svgContainer || 
                                    containerRef.current?.querySelector('.djs-container') ||
                                    containerRef.current?.querySelector('svg')?.parentElement ||
                                    containerRef.current;
                
                console.log('[BpmnEditor] Setting up drop handler, canvas element:', canvasElement);
                console.log('[BpmnEditor] Container ref:', containerRef.current);
                
                if (canvasElement) {
                    const handleDrop = async (e: DragEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('[BpmnEditor] Drop event fired!');
                        
                        try {
                            const dragDataStr = e.dataTransfer?.getData('application/bpmn-element');
                            console.log('[BpmnEditor] Drag data string:', dragDataStr);
                            
                            if (!dragDataStr) {
                                console.log('[BpmnEditor] No drag data found, checking all dataTransfer types');
                                const types = e.dataTransfer?.types || [];
                                console.log('[BpmnEditor] Available types:', types);
                                for (const type of types) {
                                    const data = e.dataTransfer?.getData(type);
                                    console.log(`[BpmnEditor] Data for type ${type}:`, data);
                                }
                                return;
                            }

                            const dragData = JSON.parse(dragDataStr);
                            console.log('[BpmnEditor] Drop received:', dragData);

                            const modeling = modeler.get('modeling');
                            const elementFactory = modeler.get('elementFactory');
                            const rootElement = canvas.getRootElement();

                            console.log('[BpmnEditor] Root element:', rootElement);

                            // Get drop position relative to canvas
                            const canvasPosition = canvas.clientToCanvas({
                                x: e.clientX,
                                y: e.clientY
                            });

                            console.log('[BpmnEditor] Canvas position:', canvasPosition);

                            // Create the element shape
                            const shape = elementFactory.createShape({
                                type: dragData.type,
                                x: canvasPosition.x,
                                y: canvasPosition.y
                            });

                            console.log('[BpmnEditor] Shape created:', shape);

                            // Append shape to root element using modeling service
                            modeling.appendShape(rootElement, shape, {
                                x: canvasPosition.x,
                                y: canvasPosition.y
                            }, rootElement);

                            console.log('[BpmnEditor] Element created successfully:', dragData.type);
                            
                            // Verify element was added
                            const elementRegistry = modeler.get('elementRegistry');
                            const allElements = elementRegistry.getAll();
                            console.log('[BpmnEditor] Total elements after creation:', allElements.length);
                        } catch (err) {
                            console.error('[BpmnEditor] Failed to create element on drop:', err);
                        }
                    };

                    const handleDragOver = (e: DragEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'copy';
                        }
                        console.log('[BpmnEditor] Drag over event');
                    };

                    const handleDragEnter = (e: DragEvent) => {
                        e.preventDefault();
                        console.log('[BpmnEditor] Drag enter event');
                    };

                    // Add listeners to canvas element
                    canvasElement.addEventListener('drop', handleDrop, true); // Use capture phase
                    canvasElement.addEventListener('dragover', handleDragOver, true);
                    canvasElement.addEventListener('dragenter', handleDragEnter, true);

                    // Also add to containerRef as fallback
                    if (containerRef.current && containerRef.current !== canvasElement) {
                        containerRef.current.addEventListener('drop', handleDrop, true);
                        containerRef.current.addEventListener('dragover', handleDragOver, true);
                        containerRef.current.addEventListener('dragenter', handleDragEnter, true);
                    }

                    // Add global listener on document as ultimate fallback
                    // This ensures we catch the drop even if bpmn-js intercepts it
                    const handleGlobalDrop = (e: DragEvent) => {
                        console.log('[BpmnEditor] Global drop handler triggered!', e.target);
                        // Check if drop target is within our canvas
                        const target = e.target as HTMLElement;
                        const isWithinCanvas = target && (
                            containerRef.current?.contains(target) || 
                            canvasElement.contains(target) ||
                            target.closest('.bpmn-editor-container') !== null
                        );
                        
                        if (isWithinCanvas) {
                            console.log('[BpmnEditor] Drop target is within canvas, checking for drag data');
                            // Try to get data - this only works during drop event
                            const dragDataStr = e.dataTransfer?.getData('application/bpmn-element') || 
                                              e.dataTransfer?.getData('text/plain');
                            console.log('[BpmnEditor] Drag data from global handler:', dragDataStr);
                            
                            if (dragDataStr) {
                                console.log('[BpmnEditor] Delegating to handleDrop');
                                handleDrop(e);
                            } else {
                                console.log('[BpmnEditor] No drag data found in global handler');
                            }
                        }
                    };

                    const handleGlobalDragOver = (e: DragEvent) => {
                        // Check if dragging over our canvas area
                        const target = e.target as HTMLElement;
                        const isWithinCanvas = target && (
                            containerRef.current?.contains(target) || 
                            canvasElement.contains(target) ||
                            target.closest('.bpmn-editor-container') !== null
                        );
                        
                        if (isWithinCanvas) {
                            // Check if it's our custom drag by checking types
                            const types = Array.from(e.dataTransfer?.types || []);
                            if (types.includes('application/bpmn-element') || types.includes('text/plain')) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer) {
                                    e.dataTransfer.dropEffect = 'copy';
                                }
                                console.log('[BpmnEditor] Global drag over canvas');
                            }
                        }
                    };

                    document.addEventListener('drop', handleGlobalDrop, true);
                    document.addEventListener('dragover', handleGlobalDragOver, true);

                    // Store cleanup function
                    (modeler as any)._customDropCleanup = () => {
                        canvasElement.removeEventListener('drop', handleDrop, true);
                        canvasElement.removeEventListener('dragover', handleDragOver, true);
                        canvasElement.removeEventListener('dragenter', handleDragEnter, true);
                        if (containerRef.current && containerRef.current !== canvasElement) {
                            containerRef.current.removeEventListener('drop', handleDrop, true);
                            containerRef.current.removeEventListener('dragover', handleDragOver, true);
                            containerRef.current.removeEventListener('dragenter', handleDragEnter, true);
                        }
                        document.removeEventListener('drop', handleGlobalDrop, true);
                        document.removeEventListener('dragover', handleGlobalDragOver, true);
                    };
                    
                    console.log('[BpmnEditor] Drop handlers registered on canvas, container, and document');
                } else {
                    console.warn('[BpmnEditor] Could not find canvas element for drop handler');
                }

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
                // Cleanup custom drop handlers
                if ((modeler as any)._customDropCleanup) {
                    (modeler as any)._customDropCleanup();
                }
                (modeler as { destroy: () => void }).destroy();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const lastXmlRef = useRef<string | null>(null);
    
    useEffect(() => {
        if (modelerRef.current && isReady && initialXml) {
            // Only re-import if initialXml actually changed (avoid unnecessary re-imports)
            if (lastXmlRef.current === initialXml) {
                console.log('[BpmnEditor] XML unchanged, skipping re-import');
                return;
            }
            
            const modeler = modelerRef.current as { importXML: (xml: string) => Promise<unknown> };
            console.log('[BpmnEditor] Re-importing XML length:', initialXml.length);
            lastXmlRef.current = initialXml;
            
            modeler.importXML(initialXml).catch((err: unknown) => {
                console.error("[BpmnEditor] Failed to import XML:", err);
                setError("Failed to render BPMN diagram");
            });
        }
    }, [initialXml, isReady]);

    // Wire selection change events to propagate to parent
    // Also setup global drop handler using eventBus
    useEffect(() => {
        if (!modelerRef.current || !isReady) return;
        const modeler = modelerRef.current;
        const eventBus = modeler.get('eventBus');
        const selection = modeler.get('selection');
        const elementRegistry = modeler.get('elementRegistry');
        const canvas = modeler.get('canvas');
        
        // Global drop handler using eventBus
        const handleGlobalDrop = (event: any) => {
            console.log('[BpmnEditor] Global drop event via eventBus:', event);
            // This is a fallback - the main handler should be on the canvas element
        };
        
        // Listen for any drag/drop events
        eventBus.on('drag.end', handleGlobalDrop);
        eventBus.on('element.create', (event: any) => {
            console.log('[BpmnEditor] Element created via eventBus:', event);
        });
        const alignToTextAnchor: Record<'left' | 'center' | 'right', string> = {
            left: 'start',
            center: 'middle',
            right: 'end',
        };

        const getStoredFormatting = (element: any) => {
            const di = element?.di;
            const attrs = di?.$attrs || {};
            return {
                font: attrs['data-font-family'],
                fontSize: attrs['data-font-size'],
                bold: attrs['data-font-weight'] === 'bold',
                italic: attrs['data-font-style'] === 'italic',
                underline: attrs['data-text-decoration'] === 'underline',
                textColor: attrs['data-font-color'],
                textAlign: attrs['data-text-align'] as 'left' | 'center' | 'right' | undefined,
            };
        };

        const applyTextFormatting = (element: any, gfx?: SVGElement) => {
            if (!element) return;
            const graphics = gfx || elementRegistry.getGraphics(element);
            if (!graphics) return;
            const stored = getStoredFormatting(element);
            const applyTo = (el: any) => {
                if (!el) return;
                const g = elementRegistry.getGraphics(el);
                if (!g) return;
                const textNodes = g.querySelectorAll('text');
                textNodes.forEach((textNode: SVGTextElement) => {
                    if (stored.font !== undefined) {
                        textNode.setAttribute('font-family', stored.font);
                    }
                    if (stored.fontSize !== undefined) {
                        textNode.setAttribute('font-size', `${stored.fontSize}`);
                    }
                    if (stored.bold !== undefined) {
                        textNode.setAttribute('font-weight', stored.bold ? 'bold' : 'normal');
                    }
                    if (stored.italic !== undefined) {
                        textNode.setAttribute('font-style', stored.italic ? 'italic' : 'normal');
                    }
                    if (stored.underline !== undefined) {
                        textNode.style.textDecoration = stored.underline ? 'underline' : 'none';
                    }
                    if (stored.textColor !== undefined) {
                        textNode.setAttribute('fill', stored.textColor);
                    }
                    if (stored.textAlign !== undefined) {
                        const textAnchor = alignToTextAnchor[stored.textAlign] || 'start';
                        textNode.setAttribute('text-anchor', textAnchor);
                    }
                });
            };

            applyTo(element);
            applyTo(element.label);
        };

        const handleSelectionChanged = (event: any) => {
            const selectionService = modeler.get('selection');
            const current = selectionService?.get?.() || event?.newSelection || [];
            lastSelectionRef.current = current;
            onSelectionChange?.(current);
        };

        const handleRender = (event: any) => {
            const { element, gfx } = event || {};
            applyTextFormatting(element, gfx);
        };

        eventBus.on('selection.changed', handleSelectionChanged);
        eventBus.on('render.shape', handleRender);
        eventBus.on('render.connection', handleRender);
        eventBus.on('render.label', handleRender);
        eventBus.on('drag.end', handleGlobalDrop);
        eventBus.on('element.create', (event: any) => {
            console.log('[BpmnEditor] ========== Element created via eventBus ==========');
            console.log('[BpmnEditor] Event:', event);
            console.log('[BpmnEditor] Element:', event.element);
            console.log('[BpmnEditor] Shape:', event.shape);
            
            // Verify element was added to registry
            const elementRegistry = modeler.get('elementRegistry');
            const allElements = elementRegistry.getAll();
            console.log('[BpmnEditor] Total elements after creation:', allElements.length);
            
            // Check if element has business object
            if (event.shape) {
                const bo = event.shape.businessObject;
                console.log('[BpmnEditor] Business object type:', bo?.$type);
                console.log('[BpmnEditor] Business object:', bo);
            }
        });
        
        eventBus.on('shape.added', (event: any) => {
            console.log('[BpmnEditor] ========== Shape added to canvas ==========');
            console.log('[BpmnEditor] Shape:', event.shape);
            console.log('[BpmnEditor] Element:', event.element);
            
            const elementRegistry = modeler.get('elementRegistry');
            const allElements = elementRegistry.getAll();
            console.log('[BpmnEditor] Total elements after shape added:', allElements.length);
        });

        // Emit current selection once on mount
        onSelectionChange?.(selection.get() || []);

        return () => {
            eventBus.off('selection.changed', handleSelectionChanged);
            eventBus.off('render.shape', handleRender);
            eventBus.off('render.connection', handleRender);
            eventBus.off('render.label', handleRender);
            eventBus.off('drag.end', handleGlobalDrop);
            eventBus.off('element.create');
            eventBus.off('shape.added');
        };
    }, [isReady, onSelectionChange]);


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
