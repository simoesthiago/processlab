/**
 * ELK.js Layout Adapter for BPMN
 * 
 * Handles automatic layout of BPMN diagrams using ELK.js.
 * Strategies:
 * - 'layered': Good for flowcharts/process diagrams (default)
 * - 'mrtree': Good for trees
 */

import ELK, { ElkNode } from 'elkjs/lib/elk.bundled';
import { BPMN_JSON, BPMNElement, Lane, SequenceFlow } from '@processlab/shared-schemas';

const elk = new ELK();

export interface LayoutOptions {
    direction?: 'RIGHT' | 'DOWN';
    spacing?: number;
}

/**
 * Returns standard dimensions for BPMN elements
 */
function getElementDimensions(type: string): { width: number, height: number } {
    const t = type.toLowerCase();
    if (t.includes('startevent') || t.includes('endevent') || t.includes('intermediatecatch') || t.includes('intermediatethrow')) {
        return { width: 36, height: 36 };
    }
    if (t.includes('gateway')) {
        return { width: 50, height: 50 };
    }
    if (t.includes('task') || t.includes('activity') || t.includes('subprocess')) {
        return { width: 120, height: 80 }; // Increased width for labels
    }
    if (t.includes('dataobject') || t.includes('datastore')) {
        return { width: 50, height: 65 };
    }
    return { width: 100, height: 80 };
}

interface ExtendedElement extends Omit<BPMNElement, 'type'> {
    parentId?: string;
    type?: string | BPMNElement['type'];
}

export const applyLayout = async (bpmn: BPMN_JSON, options: { direction?: 'RIGHT' | 'DOWN', spacing?: number } = {}): Promise<BPMN_JSON> => {
    const direction = options.direction || 'RIGHT';
    const spacing = options.spacing || 100; // Increased default spacing

    // 1. Organize Elements into Hierarchy
    // Map: ContainerID -> Children Elements
    const containerChildren = new Map<string, ExtendedElement[]>();
    const roots: ExtendedElement[] = [];
    const pools: ExtendedElement[] = [];
    const lanes: ExtendedElement[] = [];
    const elementsById = new Map<string, ExtendedElement>();

    bpmn.elements.forEach((el) => {
        const extendedEl: ExtendedElement = { ...el, type: (el as { type?: string }).type || el.type };
        elementsById.set(el.id, extendedEl);
        const elType = extendedEl.type;
        if (elType === 'bpmn:Participant') {
            pools.push(extendedEl);
        } else if (elType === 'bpmn:Lane') {
            lanes.push(extendedEl);
        }
    });

    // Assign children to containers
    bpmn.elements.forEach((el) => {
        const extendedEl: ExtendedElement = { ...el, type: (el as { type?: string }).type || el.type };
        const elType = extendedEl.type;
        if (elType !== 'bpmn:Participant' && elType !== 'bpmn:Lane') {
            const parentId = (el as { parentId?: string }).parentId;
            if (parentId) {
                if (!containerChildren.has(parentId)) containerChildren.set(parentId, []);
                containerChildren.get(parentId)?.push(extendedEl);
            } else {
                roots.push(extendedEl);
            }
        } else if (elType === 'bpmn:Lane') {
            const parentId = (el as { parentId?: string }).parentId;
            if (parentId) {
                if (!containerChildren.has(parentId)) containerChildren.set(parentId, []);
                containerChildren.get(parentId)?.push(extendedEl);
            }
        }
    });

    // 2. Layout Logic

    // Helper: Layout a list of nodes (flat) using ELK
    const layoutNodes = async (nodes: ExtendedElement[], edges: SequenceFlow[]): Promise<{ width: number, height: number, children: ElkNode[], edges: Array<{ id: string; sources: string[]; targets: string[]; sections?: unknown }> }> => {
        if (nodes.length === 0) return { width: 100, height: 100, children: [], edges: [] };

        const elkNodes: ElkNode[] = nodes.map(n => {
            const dim = getElementDimensions(n.type || 'task');
            const nodeId = typeof n.id === 'string' ? n.id : String(n.id);
            return { id: nodeId, width: dim.width, height: dim.height };
        });

        // Filter edges to only those connecting nodes in this set
        const nodeIds = new Set(nodes.map(n => n.id));
        const relevantEdges = edges
            .filter(e => e.id && nodeIds.has(e.source) && nodeIds.has(e.target))
            .map(e => ({
                id: e.id!,
                sources: [e.source],
                targets: [e.target]
            }));

        const graph: ElkNode = {
            id: 'root',
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': direction,
                // Spacing configuration
                'elk.spacing.nodeNode': spacing.toString(),
                'elk.layered.spacing.nodeNodeBetweenLayers': spacing.toString(),
                'elk.spacing.edgeNode': '40',
                'elk.layered.spacing.edgeEdgeBetweenLayers': '25',

                // Strategy for better alignment (Flowchart style)
                'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
                'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',

                // Routing
                'elk.edgeRouting': 'ORTHOGONAL',

                // Port Constraints: Force connections to sides (Left/Right)
                'elk.portConstraints': 'FIXED_SIDE',

                // Padding
                'elk.padding': '[top=40,left=40,bottom=40,right=40]',
            },
            children: elkNodes,
            edges: relevantEdges
        };

        const layoutedGraph = await elk.layout(graph);

        return {
            width: layoutedGraph.width || 100,
            height: layoutedGraph.height || 100,
            children: layoutedGraph.children || [],
            edges: layoutedGraph.edges || []
        };
    };

    // Strategy:
    // 1. Layout Lanes individually (content inside)
    // 2. Stack Lanes inside Pools
    // 3. Stack Pools and Root elements

    interface LayoutedElement extends ExtendedElement {
        x: number;
        y: number;
        width: number;
        height: number;
        parentId?: string;
    }

    interface LayoutedEdge {
        id: string;
        sections?: Array<{
            startPoint: { x: number; y: number };
            endPoint: { x: number; y: number };
            bendPoints?: Array<{ x: number; y: number }>;
        }>;
        parentId?: string;
        offsetY?: number;
    }

    const layoutedElements: LayoutedElement[] = [];
    const layoutedEdges: LayoutedEdge[] = [];

    // A. Handle Pools (and their Lanes)
    let currentY = 0;

    for (const pool of pools) {
        const poolLanes = lanes.filter(l => l.parentId === pool.id);
        let poolHeight = 0;
        let poolWidth = 0;
        let laneY = 0;

        for (const lane of poolLanes) {
            const laneId = typeof lane.id === 'string' ? lane.id : String(lane.id);
            const laneChildren = containerChildren.get(laneId) || [];
            // Layout content of the lane
            const result = await layoutNodes(laneChildren, bpmn.flows);

            // Add layouted children
            result.children.forEach(child => {
                const childId = typeof child.id === 'string' ? child.id : String(child.id);
                const original = elementsById.get(childId);
                if (original && child.x !== undefined && child.y !== undefined && child.width !== undefined && child.height !== undefined) {
                    layoutedElements.push({
                        ...original,
                        x: child.x,
                        y: child.y,
                        width: child.width,
                        height: child.height,
                        parentId: laneId
                    });
                }
            });

            // Add layouted edges (relative to Lane)
            if (result.edges) {
                result.edges.forEach(edge => {
                    const edgeId = typeof edge.id === 'string' ? edge.id : edge.id ? String(edge.id) : undefined;
                    if (edgeId) {
                        layoutedEdges.push({
                            id: edgeId,
                            sections: (edge as { sections?: LayoutedEdge['sections'] }).sections,
                            parentId: laneId
                        });
                    }
                });
            }

            const laneWidth = Math.max(result.width + 100, 600); // Min width
            const laneHeight = Math.max(result.height + 40, 150); // Min height

            const laneElement: LayoutedElement = {
                ...lane,
                id: laneId,
                type: 'bpmn:Lane',
                x: 30,
                y: laneY,
                width: laneWidth,
                height: laneHeight,
                parentId: typeof pool.id === 'string' ? pool.id : String(pool.id)
            };
            layoutedElements.push(laneElement);

            poolWidth = Math.max(poolWidth, laneWidth + 30);
            poolHeight += laneHeight;
            laneY += laneHeight;
        }

        if (poolLanes.length === 0) {
            // Empty pool or pool without lanes (treat pool as container)
            const poolId = typeof pool.id === 'string' ? pool.id : String(pool.id);
            const poolChildren = containerChildren.get(poolId)?.filter(c => c.type !== 'bpmn:Lane') || [];
            const result = await layoutNodes(poolChildren, bpmn.flows);

            result.children.forEach(child => {
                const childId = typeof child.id === 'string' ? child.id : String(child.id);
                const original = elementsById.get(childId);
                if (original && child.x !== undefined && child.y !== undefined && child.width !== undefined && child.height !== undefined) {
                    layoutedElements.push({
                        ...original,
                        x: child.x,
                        y: child.y,
                        width: child.width,
                        height: child.height,
                        parentId: poolId
                    });
                }
            });

            // Add layouted edges
            if (result.edges) {
                result.edges.forEach(edge => {
                    const edgeId = typeof edge.id === 'string' ? edge.id : edge.id ? String(edge.id) : undefined;
                    if (edgeId) {
                        layoutedEdges.push({
                            id: edgeId,
                            sections: (edge as { sections?: LayoutedEdge['sections'] }).sections,
                            parentId: poolId
                        });
                    }
                });
            }

            poolWidth = Math.max(result.width + 100, 600);
            poolHeight = Math.max(result.height + 40, 200);
        }

        const poolId = typeof pool.id === 'string' ? pool.id : String(pool.id);
        layoutedElements.push({
            ...pool,
            id: poolId,
            x: 0,
            y: currentY,
            width: poolWidth,
            height: poolHeight
        });
        currentY += poolHeight + spacing;
    }

    // B. Handle Root Elements (not in any pool)
    const rootElements = roots;
    if (rootElements.length > 0) {
        const result = await layoutNodes(rootElements, bpmn.flows);

        result.children.forEach(child => {
            const childId = typeof child.id === 'string' ? child.id : String(child.id);
            const original = elementsById.get(childId);
            if (original && child.x !== undefined && child.y !== undefined && child.width !== undefined && child.height !== undefined) {
                layoutedElements.push({
                    ...original,
                    x: child.x,
                    y: child.y + currentY,
                    width: child.width,
                    height: child.height,
                    parentId: undefined
                });
            }
        });

        // Add layouted edges
        if (result.edges) {
            result.edges.forEach(edge => {
                const edgeId = typeof edge.id === 'string' ? edge.id : edge.id ? String(edge.id) : undefined;
                if (edgeId) {
                    layoutedEdges.push({
                        id: edgeId,
                        sections: (edge as { sections?: LayoutedEdge['sections'] }).sections,
                        offsetY: currentY
                    });
                }
            });
        }
    }

    // 3. Coordinate Transformation (Relative -> Absolute)
    // We need to convert ELK's relative coordinates to absolute BPMN coordinates

    // First, map elements by ID for easy lookup
    const elementMap = new Map<string, LayoutedElement>();
    layoutedElements.forEach(el => {
        const elId = typeof el.id === 'string' ? el.id : String(el.id);
        elementMap.set(elId, el);
    });

    // Helper to get absolute position of a container
    const getAbsolutePosition = (elementId: string): { x: number, y: number } => {
        const element = elementMap.get(elementId);
        if (!element || element.x === undefined || element.y === undefined) return { x: 0, y: 0 };

        if (element.parentId) {
            const parentPos = getAbsolutePosition(element.parentId);
            return { x: element.x + parentPos.x, y: element.y + parentPos.y };
        }
        return { x: element.x, y: element.y };
    };

    const finalElements = layoutedElements.map(el => {
        if (el.parentId && el.x !== undefined && el.y !== undefined) {
            const parentPos = getAbsolutePosition(el.parentId);
            return {
                ...el,
                x: el.x + parentPos.x,
                y: el.y + parentPos.y
            };
        }
        return el;
    });

    // Process Edges: Convert sections to absolute waypoints
    const finalFlows = bpmn.flows.map(flow => {
        const layoutedEdge = layoutedEdges.find(le => le.id === flow.id);
        if (layoutedEdge && layoutedEdge.sections && layoutedEdge.sections.length > 0) {
            const section = layoutedEdge.sections[0];
            let offsetX = 0;
            let offsetY = 0;

            if (layoutedEdge.parentId) {
                const parentPos = getAbsolutePosition(layoutedEdge.parentId);
                offsetX = parentPos.x;
                offsetY = parentPos.y;
            } else if (layoutedEdge.offsetY) {
                offsetY = layoutedEdge.offsetY;
            }

            const waypoints = [
                section.startPoint,
                ...(section.bendPoints || []),
                section.endPoint
            ].map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));

            return {
                ...flow,
                waypoints: waypoints
            };
        }
        return flow;
    });

    return {
        ...bpmn,
        elements: finalElements as unknown as BPMNElement[],
        flows: finalFlows
    };
};
