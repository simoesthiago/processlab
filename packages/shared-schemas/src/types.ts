/* Auto-generated from bpmn_json.schema.json - DO NOT EDIT MANUALLY */

/**
 * BPMN JSON Format
 * 
 * Robust intermediate format for BPMN process synthesis and editing.
 * This is the internal representation used throughout ProcessLab.
 * XML conversion happens only at export/visualization time.
 */
export interface BPMN_JSON {
    process: ProcessInfo;
    lanes?: Lane[];
    elements: BPMNElement[];
    flows: SequenceFlow[];
}

/**
 * Process metadata
 */
export interface ProcessInfo {
    id: string;
    name?: string;
    documentation?: string;
}

/**
 * Lane or pool definition for hierarchical layout (ELK.js)
 */
export interface Lane {
    id: string;
    name: string;
    childElementIds?: string[];
}

/**
 * Metadata for RAG traceability
 */
export interface ElementMeta {
    sourceArtifactId?: string;
    pageNumber?: number;
}

/**
 * BPMN element (task, event, gateway)
 */
export interface BPMNElement {
    id: string;
    type:
    | "task"
    | "userTask"
    | "serviceTask"
    | "startEvent"
    | "endEvent"
    | "exclusiveGateway"
    | "parallelGateway";
    name?: string;
    /** Reference to the lane where the element resides */
    laneId?: string;
    meta?: ElementMeta;
}

/**
 * Sequence flow connecting elements
 */
export interface SequenceFlow {
    id?: string;
    source: string;
    target: string;
    type?: string;
    name?: string;
}
