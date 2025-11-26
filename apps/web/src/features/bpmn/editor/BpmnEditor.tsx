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
import type { BPMN_JSON } from '@bpmappr/shared-schemas';

// Dynamic import to avoid SSR issues with bpmn-js
// bpmn-js requires browser APIs
let BpmnModeler: any = null;
if (typeof window !== 'undefined') {
    import('bpmn-js/lib/Modeler').then((mod) => {
        BpmnModeler = mod.default;
    });
}

interface BpmnEditorProps {
    /** Initial BPMN in JSON format */
    initialBpmn?: BPMN_JSON;
    /** Callback when BPMN is modified */
    onChange?: (bpmn: BPMN_JSON) => void;
    /** Read-only mode */
    readOnly?: boolean;
}

export default function BpmnEditor({
    initialBpmn,
    onChange,
    readOnly = false,
}: BpmnEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current || !BpmnModeler) return;

        // Initialize bpmn-js modeler
        try {
            const modeler = new BpmnModeler({
                container: containerRef.current,
                keyboard: {
                    bindTo: document,
                },
            });

            modelerRef.current = modeler;
            setIsReady(true);

            // TODO: Convert BPMN_JSON to XML for visualization
            // TODO: Load XML into modeler
            // TODO: Apply ELK.js layout for pools/lanes

            // Cleanup
            return () => {
                modeler.destroy();
            };
        } catch (err) {
            console.error('Failed to initialize BPMN editor:', err);
            setError('Failed to initialize BPMN editor');
        }
    }, []);

    useEffect(() => {
        if (!isReady || !modelerRef.current || !initialBpmn) return;

        // TODO: Convert BPMN_JSON to XML
        // TODO: Import XML into modeler
        // TODO: Apply automatic layout using ELK.js

        console.log('Initial BPMN:', initialBpmn);
    }, [isReady, initialBpmn]);

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

            {/* Toolbar (placeholder) */}
            {isReady && (
                <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-2 space-x-2">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Export
                    </button>
                    {/* TODO: Add more toolbar buttons */}
                </div>
            )}
        </div>
    );
}
