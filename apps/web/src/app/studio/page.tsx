'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import VersionTimeline from '@/features/versioning/VersionTimeline';
import SaveVersionModal from '@/features/versioning/SaveVersionModal';
import BpmnEditor, { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';
import Copilot from '@/features/copiloto/Copilot';
import Citations from '@/features/citations/Citations';

// Mock types if not available
interface Process {
    id: string;
    name: string;
    project_id: string;
}

interface Version {
    id: string;
    version_number: number;
    version_label?: string;
    commit_message?: string;
    is_active: boolean;
    created_at: string;
    created_by?: string;
    change_type?: 'major' | 'minor' | 'patch';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function StudioContent() {
    const editorRef = useRef<BpmnEditorRef>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'copilot' | 'citations' | 'history'>('copilot');

    // State
    const [process, setProcess] = useState<Process | null>(null);
    const [versions, setVersions] = useState<Version[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [bpmnXml, setBpmnXml] = useState<string | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [artifactId, setArtifactId] = useState('');

    // Mock token
    const token = 'mock-token';

    useEffect(() => {
        // Load initial data if needed
        // For now, we can leave it empty or mock a process load
    }, []);

    const loadVersions = async (processId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/processes/${processId}/versions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVersions(data);
            }
        } catch (err) {
            console.error("Failed to load versions", err);
        }
    };

    const handleSave = () => {
        if (!process) {
            alert("No process loaded to save");
            return;
        }
        setIsSaveModalOpen(true);
    };

    const handleConfirmSave = async (message: string, changeType: 'major' | 'minor' | 'patch') => {
        if (!process) return;

        setIsSaving(true);
        try {
            // Get current XML from editor
            const currentXml = await editorRef.current?.getXml();
            if (!currentXml) {
                throw new Error("Failed to get XML from editor");
            }

            // Create new version
            const response = await fetch(`${API_URL}/api/v1/processes/${process.id}/versions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bpmn_json: { xml: currentXml },
                    version_label: `v${(versions[0]?.version_number || 0) + 1}`,
                    commit_message: message,
                    change_type: changeType,
                    parent_version_id: selectedVersionId,
                    is_active: true // Auto-activate for now
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create version");
            }

            const newVersion = await response.json();

            // Reload versions
            await loadVersions(process.id);
            setSelectedVersionId(newVersion.id);

            alert("Version saved successfully!");
            setIsSaveModalOpen(false);
        } catch (error) {
            console.error("Save failed:", error);
            alert("Save failed. Check console.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!artifactId) return;
        setIsGenerating(true);
        try {
            // Call generate API
            const res = await fetch(`${API_URL}/api/v1/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ artifact_id: artifactId })
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();
            // Assuming data contains xml or we need to fetch it
            if (data.xml) {
                setBpmnXml(data.xml);
                // Also set process if created
                if (data.process) setProcess(data.process);
            }
        } catch (err) {
            console.error("Generation error", err);
            alert("Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleActivateVersion = async (versionId: string) => {
        // Implement activation logic
        console.log("Activate version", versionId);
    };

    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900">
            {/* Left Panel - BPMN Editor */}
            <div className="flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
                {/* Toolbar */}
                <div className="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                            Dashboard
                        </Link>
                        {process && (
                            <>
                                <span>/</span>
                                <Link
                                    href={`/projects/${process.project_id}/processes`}
                                    className="hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    Project
                                </Link>
                                <span>/</span>
                                <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                                    {process.name}
                                </span>
                            </>
                        )}
                        {!process && (
                            <>
                                <span>/</span>
                                <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                                    New Process
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex-1" />

                    {/* Version Selector (Simplified) */}
                    {versions.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                v{versions.find(v => v.id === selectedVersionId)?.version_number}
                            </span>
                            {selectedVersionId && !versions.find(v => v.id === selectedVersionId)?.is_active && (
                                <button
                                    onClick={() => handleActivateVersion(selectedVersionId)}
                                    className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                                >
                                    Activate
                                </button>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {!process && (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={artifactId}
                                onChange={(e) => setArtifactId(e.target.value)}
                                placeholder="Artifact ID"
                                className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? "Generating..." : "Generate"}
                            </button>
                        </div>
                    )}

                    {process && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save New Version'}
                        </button>
                    )}

                    <button className="px-3 py-1.5 text-sm bg-zinc-600 text-white rounded-md hover:bg-zinc-700 transition-colors">
                        Export
                    </button>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
                    <BpmnEditor
                        ref={editorRef}
                        initialXml={bpmnXml}
                    />
                </div>
            </div>

            {/* Right Panel - Copilot & Citations & History */}
            <div className="w-96 bg-white dark:bg-zinc-950 flex flex-col border-l border-zinc-200 dark:border-zinc-800">
                {/* Tabs */}
                <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('copilot')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'copilot'
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                            }`}
                    >
                        Copilot
                    </button>
                    <button
                        onClick={() => setActiveTab('citations')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'citations'
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                            }`}
                    >
                        Citations
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'history'
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                            }`}
                    >
                        History
                    </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'copilot' && (
                        <Copilot
                            bpmnXml={bpmnXml || ''}
                            modelVersionId={selectedVersionId || undefined}
                            onEditApplied={(newBpmn, newVersionId) => {
                                console.log("Edit applied", newVersionId);
                                alert("Edit applied! (Reloading XML not yet implemented)");
                            }}
                        />
                    )}
                    {activeTab === 'citations' && <Citations />}
                    {activeTab === 'history' && (
                        <VersionTimeline
                            versions={versions}
                            selectedVersionId={selectedVersionId}
                            onSelectVersion={setSelectedVersionId}
                        />
                    )}
                </div>
            </div>

            <SaveVersionModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleConfirmSave}
                isSaving={isSaving}
            />
        </div>
    );
}
