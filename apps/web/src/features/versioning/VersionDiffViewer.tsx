'use client';

import { useEffect, useRef, useState } from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface Version {
    id: string;
    version_number: number;
    version_label?: string;
    commit_message?: string;
}

interface VersionDiffViewerProps {
    baseVersion: Version;
    compareVersion: Version;
    baseXml: string;
    compareXml: string;
    onClose: () => void;
}

export default function VersionDiffViewer({
    baseVersion,
    compareVersion,
    baseXml,
    compareXml,
    onClose
}: VersionDiffViewerProps) {
    const baseContainerRef = useRef<HTMLDivElement>(null);
    const compareContainerRef = useRef<HTMLDivElement>(null);
    const baseViewerRef = useRef<any>(null);
    const compareViewerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [diffResults, setDiffResults] = useState<any>(null);

    useEffect(() => {
        let baseViewer: any = null;
        let compareViewer: any = null;

        const initDiffViewer = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Dynamic imports
                const BpmnViewer = (await import('bpmn-js/lib/Viewer')).default;
                const { diff } = await import('bpmn-js-differ');

                if (!baseContainerRef.current || !compareContainerRef.current) {
                    return;
                }

                // Initialize viewers
                baseViewer = new BpmnViewer({
                    container: baseContainerRef.current
                });

                compareViewer = new BpmnViewer({
                    container: compareContainerRef.current
                });

                baseViewerRef.current = baseViewer;
                compareViewerRef.current = compareViewer;

                // Load XMLs into viewers
                await baseViewer.importXML(baseXml);
                await compareViewer.importXML(compareXml);

                // Calculate diff using moddle from viewers
                const moddle = baseViewer.get('moddle');
                
                const baseDefinitions = await moddle.fromXML(baseXml);
                const compareDefinitions = await moddle.fromXML(compareXml);

                const changes = diff(baseDefinitions.rootElement, compareDefinitions.rootElement);
                setDiffResults(changes);

                // Apply visual highlights based on diff
                await highlightChanges(baseViewer, compareViewer, changes);

                setIsLoading(false);
            } catch (err: any) {
                console.error('Failed to initialize diff viewer:', err);
                setError(err.message || 'Failed to load diff viewer');
                setIsLoading(false);
            }
        };

        initDiffViewer();

        return () => {
            if (baseViewer) baseViewer.destroy();
            if (compareViewer) compareViewer.destroy();
        };
    }, [baseXml, compareXml]);

    const highlightChanges = async (
        baseViewer: any,
        compareViewer: any,
        changes: any
    ) => {
        try {
            const modeling = baseViewer.get('modeling');
            const compareModeling = compareViewer.get('modeling');

            // Highlight removed elements (base viewer - red)
            if (changes._removed) {
                Object.keys(changes._removed).forEach((elementId: string) => {
                    const element = baseViewer.get('elementRegistry').get(elementId);
                    if (element) {
                        modeling.setColor(element, {
                            stroke: '#ef4444',
                            fill: '#fee2e2'
                        });
                    }
                });
            }

            // Highlight added elements (compare viewer - green)
            if (changes._added) {
                Object.keys(changes._added).forEach((elementId: string) => {
                    const element = compareViewer.get('elementRegistry').get(elementId);
                    if (element) {
                        compareModeling.setColor(element, {
                            stroke: '#22c55e',
                            fill: '#dcfce7'
                        });
                    }
                });
            }

            // Highlight modified elements (both - yellow)
            if (changes._changed) {
                Object.keys(changes._changed).forEach((elementId: string) => {
                    const baseElement = baseViewer.get('elementRegistry').get(elementId);
                    const compareElement = compareViewer.get('elementRegistry').get(elementId);
                    
                    if (baseElement) {
                        modeling.setColor(baseElement, {
                            stroke: '#eab308',
                            fill: '#fef9c3'
                        });
                    }
                    if (compareElement) {
                        compareModeling.setColor(compareElement, {
                            stroke: '#eab308',
                            fill: '#fef9c3'
                        });
                    }
                });
            }
        } catch (err) {
            console.warn('Could not apply visual highlights:', err);
        }
    };

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Error Loading Diff
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Compare Versions
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-3 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        ✕ Close
                    </button>
                </div>
                
                {/* Version Labels */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Base Version (v{baseVersion.version_number})
                        </div>
                        {baseVersion.commit_message && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {baseVersion.commit_message}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Compare Version (v{compareVersion.version_number})
                        </div>
                        {compareVersion.commit_message && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {compareVersion.commit_message}
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-200 border border-red-500"></div>
                        <span className="text-zinc-600 dark:text-zinc-400">Removed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-200 border border-green-500"></div>
                        <span className="text-zinc-600 dark:text-zinc-400">Added</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-200 border border-yellow-500"></div>
                        <span className="text-zinc-600 dark:text-zinc-400">Modified</span>
                    </div>
                </div>
            </div>

            {/* Diff Viewers */}
            <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
                {isLoading ? (
                    <div className="col-span-2 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                            <p className="text-zinc-600 dark:text-zinc-400">Loading diff...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div
                                ref={baseContainerRef}
                                className="w-full h-full"
                                style={{ minHeight: '500px' }}
                            />
                        </div>
                        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div
                                ref={compareContainerRef}
                                className="w-full h-full"
                                style={{ minHeight: '500px' }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
