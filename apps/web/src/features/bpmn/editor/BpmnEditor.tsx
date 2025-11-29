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
