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

import { useEffect, useRef, useState } from 'react';

// Import bpmn-js styles - REQUIRED for palette to appear
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import type { BPMN_JSON } from '@processlab/shared-schemas';

interface BpmnEditorProps {
    /** Initial BPMN in JSON format */
    initialBpmn?: BPMN_JSON;
    /** Initial BPMN XML (optional, overrides initialBpmn) */
    initialXml?: string;
    /** Callback when BPMN is modified */
    onChange?: (bpmn: BPMN_JSON) => void;
    /** Read-only mode */
    readOnly?: boolean;
}

export default function BpmnEditor({
    initialBpmn,
    initialXml,
    onChange,
    readOnly = false,
}: BpmnEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [BpmnModeler, setBpmnModeler] = useState<any>(null);

    // Load BpmnModeler module
    useEffect(() => {
        if (typeof window === 'undefined') return;

        import('bpmn-js/lib/Modeler').then((mod) => {
            setBpmnModeler(() => mod.default);
        }).catch(err => {
            console.error('Failed to load bpmn-js:', err);
            setError('Failed to load BPMN editor module');
        });
    }, []);

    // Initialize modeler when module is loaded
    useEffect(() => {
        if (!containerRef.current || !BpmnModeler) return;

        // Wait for container to have dimensions before initializing
        // This ensures the palette and canvas are properly sized
        const initTimer = setTimeout(() => {
            if (!containerRef.current || !BpmnModeler) return;

            try {
                const modeler = new BpmnModeler({
                    container: containerRef.current,
                    keyboard: {
                        bindTo: document,
                    },
                });

                modelerRef.current = modeler;
                setIsReady(true);

                // Load initial XML if provided, otherwise start with truly empty diagram
                if (initialXml) {
                    modeler.importXML(initialXml).catch((err: any) => {
                        console.error('Failed to load diagram:', err);
                    });
                } else {
                    // Import empty BPMN XML to avoid automatic StartEvent
                    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
                    modeler.importXML(emptyXml).catch((err: any) => {
                        console.error('Failed to create empty diagram:', err);
                    });
                }
            } catch (err) {
                console.error('Failed to initialize BPMN editor:', err);
                setError('Failed to initialize BPMN editor');
            }
        }, 100); // Small delay to ensure container has rendered

        // Cleanup
        return () => {
            clearTimeout(initTimer);
            if (modelerRef.current) {
                modelerRef.current.destroy();
            }
        };
    }, [BpmnModeler, initialXml]);

    const handleExport = async () => {
        if (!modelerRef.current) return;

        try {
            // Get XML from modeler
            const { xml } = await modelerRef.current.saveXML({ format: true });

            // TODO: Convert XML back to BPMN_JSON
            // TODO: Call onChange with updated BPMN_JSON

            console.log('Exported XML:', xml);
        } catch (err) {
            console.error('Failed to export BPMN:', err);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-red-50 text-red-600 p-4">
                <div className="text-center">
                    <h3 className="font-semibold mb-2">Editor Error</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const handleLayout = async () => {
        if (!modelerRef.current) return;

        try {
            const ELK = (await import('elkjs/lib/elk.bundled')).default;
            const elk = new ELK();

            const elementRegistry = modelerRef.current.get('elementRegistry');
            const modeling = modelerRef.current.get('modeling');
            const canvas = modelerRef.current.get('canvas');
            const rootElement = canvas.getRootElement();

            // Get all flow elements (shapes and connections)
            const elements = elementRegistry.filter((e: any) => e.parent === rootElement || e.parent?.type === 'bpmn:Lane' || e.parent?.type === 'bpmn:Participant');

            const participants = elementRegistry.filter((e: any) => e.type === 'bpmn:Participant');
            const lanes = elementRegistry.filter((e: any) => e.type === 'bpmn:Lane');

            // Filter out containers from nodes list
            const nodes = elements.filter((e: any) =>
                e.type !== 'bpmn:SequenceFlow' &&
                e.type !== 'label' &&
                e.type !== 'bpmn:Participant' &&
                e.type !== 'bpmn:Lane'
            );
            const edges = elements.filter((e: any) => e.type === 'bpmn:SequenceFlow');

            // Build ELK graph
            // Strategy: 
            // 1. Create nodes for Participants
            // 2. Create nodes for Lanes inside Participants
            // 3. Create nodes for Elements inside Lanes

            const elkChildren: any[] = [];

            // If we have participants/lanes, build hierarchy
            if (participants.length > 0) {
                participants.forEach((p: any) => {
                    const pLanes = lanes.filter((l: any) => l.parent === p);

                    const laneChildren = pLanes.map((l: any) => {
                        const lNodes = nodes.filter((n: any) => n.parent === l);
                        return {
                            id: l.id,
                            layoutOptions: {
                                'elk.direction': 'RIGHT',
                                'elk.padding': '[top=30,left=30,bottom=30,right=30]',
                            },
                            children: lNodes.map((n: any) => {
                                let width = 140;
                                let height = 90;
                                const type = n.type.toLowerCase();
                                if (type.includes('event')) { width = 30; height = 30; }
                                else if (type.includes('gateway')) { width = 40; height = 40; }
                                else if (type.includes('datastore') || type.includes('data store')) { width = 50; height = 50; }
                                else if (type.includes('dataobject') || type.includes('data object')) { width = 40; height = 50; }

                                return { id: n.id, width, height };
                            })
                        };
                    });

                    elkChildren.push({
                        id: p.id,
                        layoutOptions: {
                            'elk.direction': 'RIGHT',
                            'elk.padding': '[top=30,left=30,bottom=30,right=30]',
                        },
                        children: laneChildren
                    });
                });
            } else {
                // Flat layout fallback
                elkChildren.push(...nodes.map((n: any) => {
                    let width = 140;
                    let height = 90;
                    const type = n.type.toLowerCase();
                    if (type.includes('event')) { width = 30; height = 30; }
                    else if (type.includes('gateway')) { width = 40; height = 40; }
                    else if (type.includes('datastore') || type.includes('data store')) { width = 50; height = 50; }
                    else if (type.includes('dataobject') || type.includes('data object')) { width = 40; height = 50; }

                    return { id: n.id, width, height };
                }));
            }

            const elkGraph = {
                id: 'root',
                layoutOptions: {
                    'elk.algorithm': 'layered',
                    'elk.direction': 'RIGHT',
                    'elk.spacing.nodeNode': '50',
                    'elk.layered.spacing.nodeNodeBetweenLayers': '50',
                    'elk.padding': '[top=50,left=50,bottom=50,right=50]',
                },
                children: elkChildren,
                edges: edges.map((e: any) => ({
                    id: e.id,
                    sources: [e.source.id],
                    targets: [e.target.id],
                })),
            };

            // Run Layout
            const layoutedGraph = await elk.layout(elkGraph);

            // Apply positions recursively
            const applyPositions = (graphNode: any, parentX = 0, parentY = 0) => {
                const element = elementRegistry.get(graphNode.id);
                if (element && graphNode.id !== 'root') {
                    // For containers (Pools/Lanes), we might need to resize them too
                    if (element.type === 'bpmn:Participant' || element.type === 'bpmn:Lane') {
                        modeling.resizeShape(element, {
                            x: parentX + graphNode.x,
                            y: parentY + graphNode.y,
                            width: graphNode.width,
                            height: graphNode.height
                        });
                    } else {
                        modeling.moveElements([element], {
                            x: (parentX + graphNode.x) - element.x,
                            y: (parentY + graphNode.y) - element.y
                        });
                    }
                }

                if (graphNode.children) {
                    const currentX = (graphNode.id === 'root') ? 0 : (parentX + graphNode.x);
                    const currentY = (graphNode.id === 'root') ? 0 : (parentY + graphNode.y);

                    graphNode.children.forEach((child: any) => {
                        applyPositions(child, currentX, currentY);
                    });
                }
            };

            applyPositions(layoutedGraph);

            // Fit viewport
            canvas.zoom('fit-viewport');

        } catch (err) {
            console.error('Auto Layout failed:', err);
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* Editor Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ minHeight: '500px' }}
            />

            {/* Toolbar Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={handleLayout}
                    className="px-3 py-1.5 bg-white text-zinc-700 text-sm font-medium rounded-md shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                    Auto Layout
                </button>
            </div>

            {/* Loading State */}
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading BPMN Editor...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
