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
}

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

const BpmnEditor = forwardRef<BpmnEditorRef, BpmnEditorProps>(({
    initialBpmn,
    initialXml,
    onChange,
    readOnly = false,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<unknown>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        getXml: async () => {
            if (!modelerRef.current) throw new Error("Editor not initialized");
            const modeler = modelerRef.current as { saveXML: (options: { format: boolean }) => Promise<{ xml: string }> };
            const { xml } = await modeler.saveXML({ format: true });
            return xml;
        }
    }));

    useEffect(() => {
        let modeler: unknown;

        const initModeler = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const BpmnModeler = (await import('bpmn-js/lib/Modeler')).default;

                if (!containerRef.current) return;

                modeler = new BpmnModeler({
                    container: containerRef.current,
                    keyboard: {
                        bindTo: document
                    }
                });

                // Remove two-column class from palette to force single column layout
                const removeTwoColumnClass = () => {
                    const palette = containerRef.current?.querySelector('.djs-palette.two-column');
                    if (palette) {
                        palette.classList.remove('two-column');
                    }
                };

                // Try immediately and also after a delay to catch late rendering
                removeTwoColumnClass();
                setTimeout(removeTwoColumnClass, 100);
                setTimeout(removeTwoColumnClass, 500);

                // Use MutationObserver to catch when palette is added to DOM
                if (containerRef.current) {
                    const observer = new MutationObserver(() => {
                        removeTwoColumnClass();
                    });
                    observer.observe(containerRef.current, {
                        childList: true,
                        subtree: true
                    });
                    // Store observer for cleanup
                    (modeler as { _paletteObserver?: MutationObserver })._paletteObserver = observer;
                }

                modelerRef.current = modeler;
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
                const modelerTyped = modeler as { destroy: () => void; _paletteObserver?: MutationObserver };
                if (modelerTyped._paletteObserver) {
                    modelerTyped._paletteObserver.disconnect();
                }
                modelerTyped.destroy();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (modelerRef.current && isReady) {
            const modeler = modelerRef.current as { importXML: (xml: string) => Promise<unknown> };
            
            // If initialXml is provided, use it; otherwise ensure minimal XML is loaded
            const xmlToImport = initialXml || MINIMAL_BPMN_XML;
            
            modeler.importXML(xmlToImport).catch((err: unknown) => {
                console.error("Failed to import XML:", err);
                setError("Failed to render BPMN diagram");
            });
        }
    }, [initialXml, isReady]);


    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-red-50 text-red-600 p-4">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* Editor Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ minHeight: '500px' }}
            />


            {/* Loading State */}
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading BPMN Editor...</p>
                    </div>
                </div>
            )}
        </div>
    );
});

export default BpmnEditor;
