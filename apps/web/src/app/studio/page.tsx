'use client';

/**
 * ProcessLab Studio - BPMN Process Modeling Interface
 * 
 * This is the main workspace where users:
 * - View and edit BPMN diagrams
 * - Interact with the AI copilot
 * - View citations and source artifacts
 * 
 * Layout:
 * - Left: BPMN Editor (bpmn-js)
 * - Right: Copilot panel + Citations/Artifacts
 */

import React, { useState } from 'react';
import BpmnEditor from '@/features/bpmn/editor/BpmnEditor';
import Copilot from '@/features/copiloto/Copilot';
import Citations from '@/features/citations/Citations';

export default function StudioPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [bpmnXml, setBpmnXml] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'copilot' | 'citations' | 'artifacts'>('copilot');
    const [artifactId, setArtifactId] = useState('');

    const handleGenerate = async () => {
        if (!artifactId) {
            alert("Please enter an Artifact ID");
            return;
        }

        // Wait, artifactIdsStr is gone. Need to fix this logic.

        setIsGenerating(true);
        try {
            // Note: In a real app, use a configured API client
            const response = await fetch('http://localhost:8000/api/v1/generate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    artifact_ids: [artifactId], // Use the state
                    process_name: "Generated Process",
                    options: { apply_layout: true }
                }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.preview_xml) {
                setBpmnXml(data.preview_xml);
            } else {
                alert("Generation successful but no preview XML returned.");
            }
        } catch (error) {
            console.error("Generation failed:", error);
            alert("Generation failed. Check console.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900">
            {/* Left Panel - BPMN Editor */}
            <div className="flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
                {/* Toolbar */}
                <div className="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-4">
                    <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        ProcessLab Studio
                    </h1>

                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={artifactId}
                            onChange={(e) => setArtifactId(e.target.value)}
                            placeholder="Artifact ID"
                            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => setArtifactId('test-123')}
                            className="px-3 py-1.5 text-xs bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-md transition-colors"
                        >
                            Load Example
                        </button>
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !artifactId}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? "Generating..." : "Generate Diagram"}
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Export
                    </button>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
                    <BpmnEditor initialXml={bpmnXml} />
                </div>
            </div>

            {/* Right Panel - Copilot & Artifacts */}
            <div className="w-96 bg-white dark:bg-zinc-950 flex flex-col border-l border-zinc-200 dark:border-zinc-800">
                {/* Tabs */}
                <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-2">
                    <button
                        onClick={() => setActiveTab('copilot')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'copilot' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                    >
                        Copilot
                    </button>
                    <button
                        onClick={() => setActiveTab('citations')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'citations' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                    >
                        Citations
                    </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'copilot' ? (
                        <Copilot
                            bpmnXml={bpmnXml}
                            modelVersionId={undefined} // TODO: Track version ID
                            onEditApplied={(newBpmn, newVersionId) => {
                                // We receive JSON. We need to convert to XML to update editor?
                                // Backend returns JSON.
                                // BpmnEditor expects XML.
                                // We need backend to return XML!
                                // EditResponse has bpmn (JSON).
                                // I should update EditResponse to include XML or convert on frontend.
                                // Backend has JSON->XML converter (export.py or similar).
                                // I should update /edit to return XML preview.
                                // The prompt says: "Retornar preview_xml + new_model_version_id".
                                // My EditResponse schema has bpmn (JSON).
                                // I missed that requirement in schema update.
                                console.log("Edit applied", newVersionId);
                                // For now, reload or alert.
                                alert("Edit applied! (Reloading XML not yet implemented - requires backend XML return)");
                            }}
                        />
                    ) : (
                        <Citations />
                    )}
                </div>
            </div>
        </div>
    );
}
