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
            const canvas = modelerRef.current.get('canvas');
            const elementRegistry = modelerRef.current.get('elementRegistry');

            // Note: We NOW support hierarchical layout with Pools/Lanes!
            // The code below will handle them correctly via ELK hierarchy.

            // Robust extraction of nodes and edges
            // We filter by visual capability (shapes vs connections) and include containers.
            // CRITICAL: We must flatten the hierarchy to skip logical containers like LaneSet or Process
            // that don't act as visual parents in the ELK graph.

            const allElements = elementRegistry.getAll();

            // Map Process ID -> Participant ID to bridge the gap
            // In BPMN, Lanes are in a Process, but visually they are in a Pool (Participant).
            const processToParticipant = new Map<string, string>();
            allElements.forEach((e: any) => {
                if (e.type === 'bpmn:Participant' && e.businessObject.processRef) {
                    processToParticipant.set(e.businessObject.processRef.id, e.id);
                }
            });

            // Define what constitutes a valid layout node
            const isLayoutNode = (e: any) => {
                if (!e) return false;
                if (e.waypoints) return false; // Connection
                if (e.type === 'label') return false;
                if (e.type === 'bpmn:BoundaryEvent') return false;

                // Exclude logical roots/containers that shouldn't be ELK nodes
                const excludedTypes = [
                    'bpmn:Definitions',
                    'bpmn:Collaboration',
                    'bpmn:Process',
                    'bpmn:LaneSet'
                ];
                if (excludedTypes.includes(e.type)) return false;

                return true;
            };

            // 1. Extract Nodes (Shapes + Containers)
            const nodes = allElements.filter(isLayoutNode);
            const nodeIds = new Set(nodes.map((n: any) => n.id));

            // Build Lane -> FlowNodes map from businessObject
            // In BPMN, each Lane has a flowNodeRef array listing the IDs of elements it contains
            const laneToFlowNodes = new Map<string, Set<string>>();
            nodes.forEach((n: any) => {
                if (n.type === 'bpmn:Lane' && n.businessObject?.flowNodeRef) {
                    const refs = n.businessObject.flowNodeRef.map((ref: any) => ref.id);
                    laneToFlowNodes.set(n.id, new Set(refs));
                }
            });

            // Helper to find the nearest valid layout parent
            // CRITICAL: In bpmn-js, elements in Lanes don't have Lane as their .parent
            // They have Process as parent. We use the Lane's flowNodeRef to determine membership.
            const findLayoutParentId = (element: any): string | undefined => {
                // Check if this element is referenced by any Lane
                const elementBusinessObjectId = element.businessObject?.id;
                if (elementBusinessObjectId) {
                    for (const [laneId, flowNodeIds] of laneToFlowNodes.entries()) {
                        if (flowNodeIds.has(elementBusinessObjectId)) {
                            return laneId;
                        }
                    }
                }

                // If not in a Lane, walk up the parent tree
                let current = element.parent;
                while (current) {
                    // If current is a Process, check if it belongs to a Participant (Pool)
                    if (current.type === 'bpmn:Process') {
                        const participantId = processToParticipant.get(current.businessObject.id);
                        if (participantId && nodeIds.has(participantId)) {
                            return participantId;
                        }
                    }

                    if (nodeIds.has(current.id)) {
                        return current.id;
                    }
                    current = current.parent;
                }
                return undefined;
            };

            // 2. Extract Edges (Connections)
            // CRITICAL: Only include edges where BOTH source and target are in the extracted nodes list.
            // ELK will crash if an edge references a missing node.
            const edges = allElements.filter((e: any) => {
                if (!e.waypoints) return false;
                if (e.type !== 'bpmn:SequenceFlow') return false;

                const sourceId = e.source?.id;
                const targetId = e.target?.id;

                if (!sourceId || !targetId) return false;

                // Check if source and target are in our valid nodes list
                // Note: We need to check if the ID is in nodeIds OR if it's a re-parented ID?
                // No, ELK needs the node ID to match.

                // If we excluded BoundaryEvents, edges from them will crash ELK.
                // We should probably include BoundaryEvents, but for now let's just filter the edges to stop the crash.
                return nodeIds.has(sourceId) && nodeIds.has(targetId);
            });

            console.log(`[AutoLayout] Extracted ${nodes.length} nodes and ${edges.length} edges.`);

            if (nodes.length === 0) {
                console.warn('[AutoLayout] No nodes found.');
                canvas.zoom('fit-viewport');
                return;
            }

            // Construct BPMN_JSON-like structure with CORRECTED hierarchy
            const tempBpmn: any = {
                process: { id: 'process_1', name: 'Process 1', documentation: '' }, // Dummy process to satisfy schema
                elements: nodes.map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    parentId: findLayoutParentId(n), // Skip LaneSets/Processes, link to Lane/Pool
                })),
                flows: edges.map((e: any) => ({
                    id: e.id,
                    source: e.source?.id,
                    target: e.target?.id
                })).filter((f: any) => f.source && f.target)
            };

            console.log('[AutoLayout] Input to applyLayout:', {
                elements: tempBpmn.elements.map((e: any) => ({ id: e.id, type: e.type, parentId: e.parentId })),
                flows: tempBpmn.flows.map((f: any) => ({ id: f.id, src: f.source, tgt: f.target }))
            });

            console.log('[AutoLayout] Detailed input:');
            tempBpmn.elements.forEach((e: any) => {
                const original = nodes.find((n: any) => n.id === e.id);
                console.log(`  ${e.id}: type=${e.type}, parentId=${e.parentId}, original(x=${original?.x}, y=${original?.y})`);
            });

            // Dynamically import the layout service to avoid SSR issues with ELK
            const { applyLayout } = await import('../layout/layout');

            const layoutedBpmn = await applyLayout(tempBpmn, {
                direction: 'RIGHT',
                spacing: 80
            });

            console.log('[AutoLayout] Output from applyLayout:');
            layoutedBpmn.elements.forEach((e: any) => {
                console.log(`  ${e.id}: x=${e.x}, y=${e.y}, w=${e.width}, h=${e.height}, parentId=${e.parentId}`);
            });

            // 3. Apply positions (Bottom-Up Approach)
            // To avoid "double movement" (moving a parent moves its children), we should:
            // Option A: Move elements relative to their parent's new position?
            // Option B: Move only the elements that need to move relative to their container, then move the container?

            // Better Strategy:
            // 1. Calculate the final absolute position for EVERY element based on ELK.
            // 2. Calculate the delta (dx, dy) needed for each element from its CURRENT absolute position.
            // 3. Apply moves. BUT, bpmn-js `modeling.moveElements` moves children when parent moves.

            // 3. Apply positions
            // IMPORTANT: layoutedBpmn already has ABSOLUTE coordinates (converted in layout.ts)
            // We just need to move each element to its absolute position

            const modeling = modelerRef.current.get('modeling');

            console.log('[AutoLayout] Applying layout...');

            // Build a map of target positions
            const targetPositions = new Map<string, { x: number, y: number, width?: number, height?: number }>();
            layoutedBpmn.elements.forEach((e: any) => {
                targetPositions.set(e.id, { x: e.x, y: e.y, width: e.width, height: e.height });
            });

            // Get all elements from the canvas
            const canvasElements = elementRegistry.getAll().filter((e: any) =>
                e.id && !e.labelTarget && e.type !== 'label'
            );

            // Apply positions and sizes in correct order:
            // 1. Resize Containers (Pools/Lanes) first to ensure space
            // 2. Move Elements to their absolute positions

            // Pass 1: Resize Containers
            canvasElements.forEach((element: any) => {
                const target = targetPositions.get(element.id);
                if (!target) return;

                if ((element.type === 'bpmn:Participant' || element.type === 'bpmn:Lane') && target.width && target.height) {
                    const needsResize = Math.abs(target.width - element.width) > 1 || Math.abs(target.height - element.height) > 1;
                    if (needsResize) {
                        modeling.resizeShape(element, {
                            x: element.x,
                            y: element.y,
                            width: target.width,
                            height: target.height
                        });
                    }
                }
            });

            // Pass 2: Move All Elements (including containers if they moved position)
            canvasElements.forEach((element: any) => {
                const target = targetPositions.get(element.id);
                if (!target) return;

                // Re-read element position as it might have changed during resize
                const currentX = element.x;
                const currentY = element.y;

                const dx = target.x - currentX;
                const dy = target.y - currentY;

                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    modeling.moveElements([element], { x: dx, y: dy });
                }
            });

            // 4. Apply edge waypoints from ELK (ensures orthogonal routing and correct anchors)
            const connections = elementRegistry.filter((e: any) => e.type === 'bpmn:SequenceFlow');
            connections.forEach((connection: any) => {
                const layoutedFlow = layoutedBpmn.flows.find((f: any) => f.id === connection.id);
                if (layoutedFlow && layoutedFlow.waypoints && layoutedFlow.waypoints.length > 1) {
                    modeling.updateWaypoints(connection, layoutedFlow.waypoints);
                } else {
                    // Fallback: let bpmn-js calculate
                    modeling.layoutConnection(connection);
                }
            });

            // 5. Adjust label positions for events and gateways (create more spacing)
            canvasElements.forEach((element: any) => {
                const isEvent = element.type && (element.type.includes('Event') || element.type.includes('Gateway'));
                if (isEvent && element.label) {
                    const labelShape = element.label;
                    // Move label down by 10px for better spacing
                    modeling.moveShape(labelShape, { x: 0, y: 10 });
                }
            });

            canvas.zoom('fit-viewport');

        } catch (err) {
            console.error('Auto Layout failed:', err);
            alert('Auto Layout encountered an error. Check console for details.');
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
