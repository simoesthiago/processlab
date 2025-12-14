/* Auto-generated from bpmn_json.schema.json - DO NOT EDIT MANUALLY */

/**
 * Formato intermediário robusto para síntese e edição de processos BPMN
 */
export interface BPMN_JSON {
  process: ProcessInfo;
  /**
   * Definição de raias e pools para layout hierárquico (ELK.js)
   */
  lanes?: Lane[];
  elements: BPMNElement[];
  flows: SequenceFlow[];
  [k: string]: unknown;
}
export interface ProcessInfo {
  id: string;
  name?: string;
  documentation?: string;
  [k: string]: unknown;
}
export interface Lane {
  id: string;
  name: string;
  childElementIds?: string[];
  [k: string]: unknown;
}
export interface BPMNElement {
  id: string;
  type: "task" | "userTask" | "serviceTask" | "startEvent" | "endEvent" | "exclusiveGateway" | "parallelGateway";
  name?: string;
  /**
   * Referência à raia onde o elemento reside
   */
  laneId?: string;
  meta?: ElementMeta;
  [k: string]: unknown;
}
/**
 * Dados para rastreabilidade (citações do RAG)
 */
export interface ElementMeta {
  sourceArtifactId?: string;
  pageNumber?: number;
  [k: string]: unknown;
}
export interface SequenceFlow {
  id?: string;
  source: string;
  target: string;
  type: string;
  name?: string;
  waypoints?: {
    x: number;
    y: number;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
