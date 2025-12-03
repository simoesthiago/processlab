/**
 * ELK.js Layout Adapter for BPMN
 * 
 * Handles automatic layout of BPMN diagrams using ELK.js.
 * Strategies:
 * - 'layered': Good for flowcharts/process diagrams (default)
 * - 'mrtree': Good for trees
 */

import ELK, { ElkNode } from 'elkjs/lib/elk.bundled';
import { BPMN_JSON } from '@processlab/shared-schemas';

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

export const applyLayout = async (bpmn: BPMN_JSON, options: { direction?: 'RIGHT' | 'DOWN', spacing?: number } = {}): Promise<BPMN_JSON> => {
    const direction = options.direction || 'RIGHT';
    const spacing = options.spacing || 100; // Increased default spacing

    // 1. Organize Elements into Hierarchy
    // Map: ContainerID -> Children Elements
    const containerChildren = new Map<string, any[]>();
    const roots: any[] = [];
    const pools: any[] = [];
    const lanes: any[] = [];
    const elementsById = new Map<string, any>();

    bpmn.elements.forEach((el: any) => {
        elementsById.set(el.id, el);
        if (el.type === 'bpmn:Participant') {
            pools.push(el);
        } else if (el.type === 'bpmn:Lane') {
            lanes.push(el);
        }
    });

    // Assign children to containers
    bpmn.elements.forEach((el: any) => {
        if (el.type !== 'bpmn:Participant' && el.type !== 'bpmn:Lane') {
            const parentId = el.parentId;
            if (parentId) {
                if (!containerChildren.has(parentId)) containerChildren.set(parentId, []);
                containerChildren.get(parentId)?.push(el);
            } else {
                roots.push(el);
            }
        } else if (el.type === 'bpmn:Lane') {
            const parentId = el.parentId;
            if (parentId) {
                if (!containerChildren.has(parentId)) containerChildren.set(parentId, []);
                containerChildren.get(parentId)?.push(el);
            }
        }
    });

    // 2. Layout Logic

    // Helper: Layout a list of nodes (flat) using ELK
    const layoutNodes = async (nodes: any[], edges: any[]): Promise<{ width: number, height: number, children: any[], edges: any[] }> => {
        if (nodes.length === 0) return { width: 100, height: 100, children: [], edges: [] };

        const elkNodes: ElkNode[] = nodes.map(n => {
            const dim = getElementDimensions(n.type);
            return { id: n.id, width: dim.width, height: dim.height };
        });

        // Filter edges to only those connecting nodes in this set
        const nodeIds = new Set(nodes.map(n => n.id));
        const relevantEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)).map(e => ({
            id: e.id,
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

    const layoutedElements: any[] = [];
    const layoutedEdges: any[] = []; // Store edges with waypoints

    // A. Handle Pools (and their Lanes)
    let currentY = 0;

    for (const pool of pools) {
        const poolLanes = lanes.filter(l => l.parentId === pool.id);
        let poolHeight = 0;
        let poolWidth = 0;
        let laneY = 0;

        for (const lane of poolLanes) {
            const laneChildren = containerChildren.get(lane.id) || [];
            // Layout content of the lane
            const result = await layoutNodes(laneChildren, bpmn.flows);

            // Add layouted children
            result.children.forEach(child => {
                layoutedElements.push({
                    ...elementsById.get(child.id), // Get original properties
                    x: child.x, // Relative to Lane (will be adjusted later)
                    y: child.y,
                    width: child.width,
                    height: child.height,
                    parentId: lane.id
                });
            });

            // Add layouted edges (relative to Lane)
            result.edges.forEach(edge => {
                layoutedEdges.push({
                    id: edge.id,
                    sections: edge.sections,
                    parentId: lane.id // Mark as belonging to this lane for coordinate offset
                });
            });

            const laneWidth = Math.max(result.width + 100, 600); // Min width
            const laneHeight = Math.max(result.height + 40, 150); // Min height

            layoutedElements.push({
                ...lane, // Original lane properties
                x: 30, // Header width
                y: laneY,
                width: laneWidth,
                height: laneHeight,
                parentId: pool.id
            });

            poolWidth = Math.max(poolWidth, laneWidth + 30);
            poolHeight += laneHeight;
            laneY += laneHeight;
        }

        if (poolLanes.length === 0) {
            // Empty pool or pool without lanes (treat pool as container)
            const poolChildren = containerChildren.get(pool.id)?.filter(c => c.type !== 'bpmn:Lane') || [];
            const result = await layoutNodes(poolChildren, bpmn.flows);

            result.children.forEach(child => {
                layoutedElements.push({
                    ...elementsById.get(child.id),
                    x: child.x,
                    y: child.y,
                    width: child.width,
                    height: child.height,
                    parentId: pool.id
                });
            });

            // Add layouted edges
            result.edges.forEach(edge => {
                layoutedEdges.push({
                    id: edge.id,
                    sections: edge.sections,
                    parentId: pool.id
                });
            });

            poolWidth = Math.max(result.width + 100, 600);
            poolHeight = Math.max(result.height + 40, 200);
        }

        layoutedElements.push({
            ...pool,
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
            layoutedElements.push({
                ...elementsById.get(child.id),
                x: child.x,
                y: child.y + currentY, // Stack below pools
                width: child.width,
                height: child.height,
                parentId: undefined
            });
        });

        // Add layouted edges
        result.edges.forEach(edge => {
            layoutedEdges.push({
                id: edge.id,
                sections: edge.sections,
                offsetY: currentY // Add offset for root elements
            });
        });
    }

    // 3. Coordinate Transformation (Relative -> Absolute)
    // We need to convert ELK's relative coordinates to absolute BPMN coordinates

    // First, map elements by ID for easy lookup
    const elementMap = new Map<string, any>();
    layoutedElements.forEach(el => elementMap.set(el.id, el));

    // Helper to get absolute position of a container
    const getAbsolutePosition = (elementId: string): { x: number, y: number } => {
        const element = elementMap.get(elementId);
        if (!element) return { x: 0, y: 0 };

        if (element.parentId) {
            const parentPos = getAbsolutePosition(element.parentId);
            return { x: element.x + parentPos.x, y: element.y + parentPos.y };
        }
        return { x: element.x, y: element.y };
    };

    const finalElements = layoutedElements.map(el => {
        if (el.parentId) {
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
        elements: finalElements,
        flows: finalFlows
    };
};
