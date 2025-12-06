'use client';

/**
 * Studio Content Component
 * 
 * Redesigned BPMN Editor workspace with:
 * - Professional navbar integrated with app design
 * - Separate elements sidebar (not overlapping canvas)
 * - Collapsible and resizable Copilot panel (like Cursor)
 * - Consistent color palette with ProcessLab design system
 */

import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspaceType } from '@/contexts/WorkspaceContext';
import { StudioNavbar } from '@/components/layout/StudioNavbar';
import { ResizablePanel } from '@/components/ui/resizable-panel';
import { ElementsSidebar } from '@/features/bpmn/ElementsSidebar';
import VersionTimeline from '@/features/versioning/VersionTimeline';
import SaveVersionModal from '@/features/versioning/SaveVersionModal';
import RestoreVersionModal from '@/features/versioning/RestoreVersionModal';
import VersionDiffViewer from '@/features/versioning/VersionDiffViewer';
import BpmnEditor, { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';
import Copilot from '@/features/copiloto/Copilot';
import Citations from '@/features/citations/Citations';
import { Toast, ToastType } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  FileText, 
  Clock, 
  ChevronDown,
  Wand2,
} from 'lucide-react';

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

type RightPanelTab = 'copilot' | 'citations' | 'history';

export default function StudioContent({
  processId: initialProcessId,
  projectId,
  workspaceId,
  workspaceType,
  basePath,
}: StudioContentProps) {
  const editorRef = useRef<BpmnEditorRef>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RightPanelTab>('copilot');
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

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

  const handleExport = async () => {
    try {
      const xml = await editorRef.current?.getXml();
      if (xml) {
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${process?.name || 'process'}.bpmn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToast({ message: 'Process exported successfully!', type: 'success' });
      }
    } catch (err) {
      console.error('Export failed:', err);
      setToast({ message: 'Export failed', type: 'error' });
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

  // Tab buttons config
  const tabs: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'copilot', label: 'Copilot', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: 'citations', label: 'Citations', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'history', label: 'History', icon: <Clock className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Professional Navbar */}
      <StudioNavbar
        process={process}
        versions={versions}
        selectedVersionId={selectedVersionId}
        basePath={basePath}
        isSaving={isSaving}
        isGenerating={isGenerating}
        onSave={handleSave}
        onExport={handleExport}
        onActivateVersion={handleActivateVersion}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Elements Sidebar */}
        <ElementsSidebar className="hidden lg:flex" />

        {/* Center: Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Generation Bar (when no process) */}
          {!process && (
            <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
              <Wand2 className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Generate from artifact:</span>
              <input
                type="text"
                value={artifactId}
                onChange={(e) => setArtifactId(e.target.value)}
                placeholder="Enter Artifact ID"
                className="px-3 py-1.5 text-sm border border-input rounded-md bg-background w-64 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !artifactId}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-md font-medium transition-colors',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          )}

          {/* BPMN Editor Canvas */}
          <div className="flex-1 bg-muted/30 overflow-hidden relative">
            {isLoadingVersion && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading version...</p>
                </div>
              </div>
            )}
            <BpmnEditor
              ref={editorRef}
              initialXml={bpmnXml}
            />
          </div>
        </div>

        {/* Right: Collapsible & Resizable Panel */}
        <ResizablePanel
          defaultWidth={380}
          minWidth={320}
          maxWidth={560}
          defaultCollapsed={rightPanelCollapsed}
          position="right"
          onCollapsedChange={setRightPanelCollapsed}
          headerContent={
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-full overflow-hidden">
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
        </ResizablePanel>
      </div>

      {/* Modals */}
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
