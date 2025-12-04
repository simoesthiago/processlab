'use client';

/**
 * Studio Content Component
 * 
 * Shared BPMN Editor content component used across workspace types.
 * Handles process loading, editing, and version management.
 */

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import VersionTimeline from '@/features/versioning/VersionTimeline';
import SaveVersionModal from '@/features/versioning/SaveVersionModal';
import RestoreVersionModal from '@/features/versioning/RestoreVersionModal';
import VersionDiffViewer from '@/features/versioning/VersionDiffViewer';
import BpmnEditor, { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';
import Copilot from '@/features/copiloto/Copilot';
import Citations from '@/features/citations/Citations';
import { Toast, ToastType } from '@/components/ui/toast';
import { WorkspaceType } from '@/contexts/WorkspaceContext';

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

interface StudioContentProps {
  processId?: string;
  projectId?: string;
  workspaceId?: string;
  workspaceType?: WorkspaceType;
  basePath: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function StudioContent({
  processId: initialProcessId,
  projectId,
  workspaceId,
  workspaceType,
  basePath,
}: StudioContentProps) {
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

  // Diff viewer state
  const [diffViewerOpen, setDiffViewerOpen] = useState(false);
  const [baseVersion, setBaseVersion] = useState<Version | null>(null);
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);
  const [baseXml, setBaseXml] = useState<string>('');
  const [compareXml, setCompareXml] = useState<string>('');
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  // Restore modal state
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<Version | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Get auth token
  const { token } = useAuth();

  // Load process if processId is provided
  useEffect(() => {
    if (initialProcessId && token) {
      loadProcess(initialProcessId);
    }
  }, [initialProcessId, token]);

  const loadProcess = async (processId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/processes/${processId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProcess(data);
        await loadVersions(processId);
        
        // Load active version's XML
        if (data.current_version_id) {
          const xml = await loadVersionXml(processId, data.current_version_id);
          setBpmnXml(xml);
          setSelectedVersionId(data.current_version_id);
        }
      }
    } catch (err) {
      console.error("Failed to load process", err);
      setToast({ message: 'Failed to load process', type: 'error' });
    }
  };

  const loadVersions = async (processId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/processes/${processId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Failed to load versions", err);
    }
  };

  const handleSave = () => {
    if (!process) {
      setToast({ message: 'No process loaded to save', type: 'warning' });
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async (message: string, changeType: 'major' | 'minor' | 'patch') => {
    if (!process) return;

    setIsSaving(true);
    try {
      const currentXml = await editorRef.current?.getXml();
      if (!currentXml) {
        throw new Error("Failed to get XML from editor");
      }

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
          is_active: true
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create version");
      }

      const newVersion = await response.json();
      await loadVersions(process.id);
      setSelectedVersionId(newVersion.id);

      setToast({ message: 'Version saved successfully!', type: 'success' });
      setIsSaveModalOpen(false);
    } catch (error: any) {
      console.error("Save failed:", error);
      setToast({ message: `Save failed: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!artifactId) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          artifact_id: artifactId,
          project_id: projectId,
          organization_id: workspaceType === 'organization' ? workspaceId : undefined,
        })
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      if (data.xml) {
        setBpmnXml(data.xml);
        if (data.process) setProcess(data.process);
      }
    } catch (err) {
      console.error("Generation error", err);
      setToast({ message: 'Generation failed', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (!process) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/v1/processes/${process.id}/versions/${versionId}/activate`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to activate version');
      }

      await loadVersions(process.id);
      setToast({ message: 'Version activated successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Activation failed:', error);
      setToast({ message: `Failed to activate version: ${error.message || 'Unknown error'}`, type: 'error' });
    }
  };

  const handleSelectVersion = async (versionId: string) => {
    setSelectedVersionId(versionId);
    
    if (process) {
      setIsLoadingVersion(true);
      try {
        const versionXml = await loadVersionXml(process.id, versionId);
        if (versionXml) {
          setBpmnXml(versionXml);
        }
      } catch (error) {
        console.error('Failed to load version XML:', error);
        setToast({ message: 'Failed to load version', type: 'error' });
      } finally {
        setIsLoadingVersion(false);
      }
    }
  };

  const loadVersionXml = async (processId: string, versionId: string): Promise<string> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/processes/${processId}/versions/${versionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.xml || '';
      }
    } catch (err) {
      console.error("Failed to load version XML", err);
    }
    return '';
  };

  const handleCompareVersions = async (baseVersionId: string, compareVersionId: string) => {
    if (!process) return;

    setIsLoadingDiff(true);
    setDiffViewerOpen(true);

    try {
      const base = versions.find(v => v.id === baseVersionId);
      const compare = versions.find(v => v.id === compareVersionId);

      if (!base || !compare) {
        throw new Error("Versions not found");
      }

      setBaseVersion(base);
      setCompareVersion(compare);

      const [baseXmlData, compareXmlData] = await Promise.all([
        loadVersionXml(process.id, baseVersionId),
        loadVersionXml(process.id, compareVersionId)
      ]);

      setBaseXml(baseXmlData);
      setCompareXml(compareXmlData);
    } catch (error) {
      console.error("Failed to load versions for comparison", error);
      setToast({ message: 'Failed to load versions for comparison', type: 'error' });
      setDiffViewerOpen(false);
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const handleRestoreVersion = async (commitMessage?: string) => {
    if (!process || !versionToRestore) return;

    setIsRestoring(true);
    try {
      const response = await fetch(
        `${API_URL}/api/v1/processes/${process.id}/versions/${versionToRestore.id}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            commit_message: commitMessage
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to restore version');
      }

      const restoredVersion = await response.json();
      await loadVersions(process.id);
      setSelectedVersionId(restoredVersion.id);

      const versionData = await loadVersionXml(process.id, restoredVersion.id);
      if (versionData) {
        setBpmnXml(versionData);
      }

      setToast({ message: 'Version restored successfully!', type: 'success' });
      setIsRestoreModalOpen(false);
      setVersionToRestore(null);
    } catch (error: any) {
      console.error('Restore failed:', error);
      setToast({ message: `Restore failed: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenRestoreModal = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setVersionToRestore(version);
      setIsRestoreModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900">
      {/* Left Panel - BPMN Editor */}
      <div className="flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
        {/* Toolbar */}
        <div className="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href={basePath} className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Dashboard
            </Link>
            {process && (
              <>
                <span>/</span>
                <Link
                  href={`${basePath}/projects/${process.project_id}`}
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

          {/* Version Selector */}
          {versions.length > 0 && selectedVersionId && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Viewing:</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                v{versions.find(v => v.id === selectedVersionId)?.version_number}
              </span>
              {versions.find(v => v.id === selectedVersionId)?.is_active && (
                <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">
                  Active
                </span>
              )}
              {selectedVersionId && !versions.find(v => v.id === selectedVersionId)?.is_active && (
                <button
                  onClick={() => handleActivateVersion(selectedVersionId)}
                  className="px-2 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
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
          {isLoadingVersion && (
            <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading version...</p>
              </div>
            </div>
          )}
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
                setToast({ message: 'Edit applied! Reloading...', type: 'info' });
              }}
            />
          )}
          {activeTab === 'citations' && <Citations />}
          {activeTab === 'history' && (
            <VersionTimeline
              versions={versions}
              selectedVersionId={selectedVersionId}
              onSelectVersion={handleSelectVersion}
              onCompareVersions={handleCompareVersions}
              onRestoreVersion={handleOpenRestoreModal}
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

      <RestoreVersionModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setVersionToRestore(null);
        }}
        onRestore={handleRestoreVersion}
        isRestoring={isRestoring}
        version={versionToRestore}
      />

      {diffViewerOpen && baseVersion && compareVersion && (
        <VersionDiffViewer
          baseVersion={baseVersion}
          compareVersion={compareVersion}
          baseXml={baseXml}
          compareXml={compareXml}
          onClose={() => {
            setDiffViewerOpen(false);
            setBaseVersion(null);
            setCompareVersion(null);
            setBaseXml('');
            setCompareXml('');
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

