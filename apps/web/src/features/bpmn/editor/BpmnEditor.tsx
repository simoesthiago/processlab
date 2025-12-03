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

// Type definition placeholder if not found
import { BPMN_JSON } from '@processlab/shared-schemas';

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
    const modelerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        getXml: async () => {
            if (!modelerRef.current) throw new Error("Editor not initialized");
            const { xml } = await modelerRef.current.saveXML({ format: true });
            return xml;
        }
    }));

    useEffect(() => {
        let modeler: any;

        const initModeler = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const BpmnModeler = (await import('bpmn-js/lib/Modeler')).default;

                if (!containerRef.current) return;

                modeler = new BpmnModeler({
                    container: containerRef.current,
                    keyboard: {
                        bindTo: document
                    },
                    additionalModules: [
                        // Add any additional modules here
                    ]
                });

                modelerRef.current = modeler;

                modeler.on('commandStack.changed', async () => {
                    if (onChange) {
                        // Convert XML to JSON if needed, or just pass XML wrapped
                        // For now, we might not have the XML->JSON converter on frontend
                        // So we might skip this or just pass null
                    }
                });

                setIsReady(true);

            } catch (err: any) {
                console.error("Failed to initialize BPMN modeler:", err);
                setError(err.message);
            }
        };

        if (!modelerRef.current) {
            initModeler();
        }

        return () => {
            if (modeler) {
                modeler.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (modelerRef.current && initialXml) {
            modelerRef.current.importXML(initialXml).catch((err: any) => {
                console.error("Failed to import XML:", err);
                setError("Failed to render BPMN diagram");
            });
        }
    }, [initialXml, isReady]);

    const handleLayout = async () => {
        if (!modelerRef.current) return;
        try {
            // Placeholder for auto layout
            // In a real implementation, we would use bpmn-auto-layout or ELK
            console.log("Auto layout requested");
            const { xml } = await modelerRef.current.saveXML({ format: true });
            // Re-importing usually doesn't layout unless we have a layout module
            // For now, we just log
            alert("Auto layout not fully implemented yet");
        } catch (err) {
            console.error("Layout failed", err);
        }
    };

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
});

BpmnEditor.displayName = 'BpmnEditor';

export default BpmnEditor;
