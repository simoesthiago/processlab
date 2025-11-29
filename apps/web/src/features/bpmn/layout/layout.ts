/**
 * ELK.js Layout Adapter for BPMN
 * 
 * Handles automatic layout of BPMN diagrams using ELK.js.
 * Strategies:
 * - 'layered': Good for flowcharts/process diagrams (default)
 * - 'mrtree': Good for trees
 */

import ELK, { ElkNode, ElkPrimitiveEdge } from 'elkjs/lib/elk.bundled';
import { BPMN_JSON, BPMNElement, SequenceFlow } from '@processlab/shared-schemas';

const elk = new ELK();

export interface LayoutOptions {
    direction?: 'RIGHT' | 'DOWN';
    spacing?: number;
}

export async function applyLayout(bpmn: BPMN_JSON, options: LayoutOptions = {}): Promise<BPMN_JSON> {
    const { direction = 'RIGHT', spacing = 50 } = options;

    // 1. Convert BPMN to ELK Graph
    const elkGraph: ElkNode = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': direction,
            'elk.spacing.nodeNode': spacing.toString(),
            'elk.layered.spacing.nodeNodeBetweenLayers': spacing.toString(),
            'elk.padding': '[top=50,left=50,bottom=50,right=50]',
        },
        children: bpmn.elements.map((element: BPMNElement) => ({
            id: element.id || 'unknown',
            // Default sizes for BPMN elements (ELK will handle layout)
            width: 100,
            height: 80,
        })),
        edges: bpmn.flows.map((flow: SequenceFlow) => ({
            id: flow.id || `flow-${flow.source}-${flow.target}`,
            sources: [flow.source],
            targets: [flow.target],
        })),
    };

    try {
        // 2. Run Layout
        const layoutedGraph = await elk.layout(elkGraph);

        // 3. Apply positions back to BPMN
        const newElements = bpmn.elements.map((element: BPMNElement) => {
            const layoutedNode = layoutedGraph.children?.find(n => n.id === element.id);
            if (layoutedNode) {
                return {
                    ...element,
                    x: layoutedNode.x,
                    y: layoutedNode.y,
                };
            }
            return element;
        });

        // Note: ELK also returns edge routing points (sections).
        // bpmn-js usually handles routing automatically if we just give it nodes,
        // but for better results we might want to use the waypoints.
        // For Sprint 4, we'll let bpmn-js auto-route based on new node positions
        // unless we want to be very precise.
        // To keep it simple and robust, we update node positions and let the modeler
        // re-route connections or we can update waypoints if we have them.
        // Updating waypoints in BPMN_JSON is complex because BPMNEdge doesn't strictly define them in our schema yet?
        // Let's check schema. BPMNEdge has 'waypoints'?
        // If not, we just update nodes.

        return {
            ...bpmn,
            elements: newElements,
        };

    } catch (err) {
        console.error('ELK Layout failed:', err);
        throw err;
    }
}
