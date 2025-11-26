/**
 * BPMN I/O Module
 * 
 * Handles conversion between BPMN_JSON and XML formats.
 * 
 * Architecture Note:
 * The editor operates on JSON internally and converts to XML
 * only at export/visualization time (cite PRD: 166).
 */

import type { BPMN_JSON } from '@bpmappr/shared-schemas';

/**
 * Convert BPMN_JSON to BPMN 2.0 XML
 * 
 * This is used for:
 * - Exporting to external tools (Camunda, Flowable, etc.)
 * - Visualization in bpmn-js
 * 
 * @param bpmn BPMN in JSON format
 * @returns BPMN 2.0 XML string
 */
export function jsonToXml(bpmn: BPMN_JSON): string {
    // TODO: Implement proper JSON -> XML conversion
    // TODO: Use bpmn-moddle or similar library
    // TODO: Include diagram interchange (DI) elements for positioning

    const processId = bpmn.process.id;
    const processName = bpmn.process.name || 'Unnamed Process';

    // Stub XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  targetNamespace="http://bpmappr.io/schema/bpmn">
  <bpmn:process id="${processId}" name="${processName}" isExecutable="false">
    <!-- TODO: Convert elements and flows -->
    <!-- Elements: ${bpmn.elements.length} -->
    <!-- Flows: ${bpmn.flows.length} -->
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <!-- TODO: Add diagram interchange -->
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

/**
 * Convert BPMN 2.0 XML to BPMN_JSON
 * 
 * Used for importing existing BPMN files.
 * 
 * @param xml BPMN 2.0 XML string
 * @returns BPMN in JSON format
 */
export function xmlToJson(xml: string): BPMN_JSON {
    // TODO: Implement XML -> JSON conversion
    // TODO: Parse XML using DOMParser or bpmn-moddle
    // TODO: Extract elements, flows, and lanes

    // Stub: return minimal BPMN
    return {
        process: {
            id: 'process_1',
            name: 'Imported Process',
        },
        elements: [],
        flows: [],
    };
}

/**
 * Download BPMN as file
 */
export function downloadBpmn(bpmn: BPMN_JSON, format: 'json' | 'xml' = 'xml') {
    const content = format === 'xml' ? jsonToXml(bpmn) : JSON.stringify(bpmn, null, 2);
    const mimeType = format === 'xml' ? 'application/xml' : 'application/json';
    const extension = format === 'xml' ? 'bpmn' : 'bpmn.json';
    const filename = `${bpmn.process.id}.${extension}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Upload BPMN file
 */
export async function uploadBpmn(file: File): Promise<BPMN_JSON> {
    const content = await file.text();

    // Detect format
    if (file.name.endsWith('.json')) {
        return JSON.parse(content) as BPMN_JSON;
    } else {
        return xmlToJson(content);
    }
}
