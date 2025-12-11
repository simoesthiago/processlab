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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspaceType } from '@/contexts/WorkspaceContext';
import { StudioNavbar } from '@/components/layout/StudioNavbar';
import { FormatToolbar } from '@/components/layout/FormatToolbar';
import { ResizablePanel } from '@/components/ui/resizable-panel';
import VersionTimeline from '@/features/versioning/VersionTimeline';
import SaveVersionModal from '@/features/versioning/SaveVersionModal';
import RestoreVersionModal from '@/features/versioning/RestoreVersionModal';
import ConflictModal from '@/features/versioning/ConflictModal';
import BpmnEditor, { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';
import Copilot from '@/features/copiloto/Copilot';
import ProcessWizard from '@/features/copiloto/ProcessWizard';
import Citations from '@/features/citations/Citations';
import { Toast, ToastType } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  FileText,
  Clock,
  ChevronDown,
  Wand2,
  Search,
  PanelRightOpen,
} from 'lucide-react';

interface Process {
  id: string;
  name: string;
  project_id?: string | null;
  folder_id?: string | null;
  organization_id?: string | null;
  user_id?: string | null;
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
  etag?: string;
}

interface StudioContentProps {
  processId?: string;
  projectId?: string;
  workspaceId?: string;
  workspaceType?: WorkspaceType;
  basePath: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type RightPanelTab = 'copilot' | 'citations' | 'history' | 'search';
type PanelTab = RightPanelTab | 'wizard';

interface ConflictDetail {
  message?: string;
  yourEtag?: string;
  currentEtag?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export default function StudioContent({
  processId: initialProcessId,
  projectId,
  workspaceId,
  workspaceType,
  basePath,
}: StudioContentProps) {
  const editorRef = useRef<BpmnEditorRef>(null);
  const router = useRouter();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // State
  const [process, setProcess] = useState<Process | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedVersionEtag, setSelectedVersionEtag] = useState<string | undefined>(undefined);
  const [latestVersionId, setLatestVersionId] = useState<string | null>(null);
  const [bpmnXml, setBpmnXml] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [artifactId, setArtifactId] = useState('');
  const [pendingSave, setPendingSave] = useState<{ message: string; changeType: 'major' | 'minor' | 'patch' } | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictDetail | null>(null);
  const [projectName, setProjectName] = useState<string>('Project');
  const [spaceName, setSpaceName] = useState<string>('');
  const [processName, setProcessName] = useState<string>('New Process');
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);


  // Restore modal state
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<Version | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [wizardPanelCollapsed, setWizardPanelCollapsed] = useState(false);
  const [showWizard, setShowWizard] = useState(true);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Get auth token
  const { token } = useAuth();

  // Load space name immediately when workspaceId is available
  useEffect(() => {
    if (workspaceId && workspaceType && token) {
      const loadSpaceName = async () => {
        try {
          // For 'private' space, use hardcoded name
          if (workspaceId === 'private') {
            setSpaceName('Private Space');
          } else {
            // For organization spaces, try to get from spaces list
            const spacesRes = await fetch(`${API_URL}/api/v1/spaces`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (spacesRes.ok) {
              const spacesData = await spacesRes.json();
              const space = spacesData.spaces?.find((s: { id: string }) => s.id === workspaceId);
              setSpaceName(space?.name || 'Space');
            } else {
              setSpaceName('Space');
            }
          }
        } catch (err) {
          console.error("Failed to load space info", err);
          setSpaceName(workspaceType === 'personal' ? 'Private Space' : 'Space');
        }
      };
      loadSpaceName();
    }
  }, [workspaceId, workspaceType, token]);

  // Load process if processId is provided
  useEffect(() => {
    if (initialProcessId && token) {
      loadProcess(initialProcessId);
    }
  }, [initialProcessId, token]);

  // Sync selected etag when versions list changes
  useEffect(() => {
    if (selectedVersionId && versions.length > 0) {
      const match = versions.find((v) => v.id === selectedVersionId);
      setSelectedVersionEtag(match?.etag);
    }
  }, [selectedVersionId, versions]);

  const loadProcess = async (processId: string) => {
    try {
      // Use space endpoint if workspaceId is provided and it's not a project
      let res;
      if (workspaceId && !projectId) {
        // Load from space endpoint
        res = await fetch(`${API_URL}/api/v1/spaces/${workspaceId}/processes/${processId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        // Load from general processes endpoint
        res = await fetch(`${API_URL}/api/v1/processes/${processId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (res.ok) {
        const data = await res.json();
        setProcess(data);
        
        // Load project name for breadcrumbs (if process has project_id)
        if (data.project_id) {
          try {
            const projectRes = await fetch(`${API_URL}/api/v1/projects/${data.project_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (projectRes.ok) {
              const projectData = await projectRes.json();
              setProjectName(projectData.name || 'Project');
            }
          } catch (err) {
            console.error("Failed to load project info", err);
            setProjectName('Project');
          }
        } else {
          setProjectName('');
        }

        // Load folder path if process is in a folder
        if (data.folder_id && workspaceId) {
          try {
            const folderPathRes = await fetch(`${API_URL}/api/v1/spaces/${workspaceId}/folders/${data.folder_id}/path`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (folderPathRes.ok) {
              const folderPathData = await folderPathRes.json();
              // Extract folder path with IDs and names
              const pathItems = folderPathData.path?.map((item: { id: string; name: string }) => ({
                id: item.id,
                name: item.name
              })) || [];
              setFolderPath(pathItems);
            }
          } catch (err) {
            console.error("Failed to load folder path", err);
            setFolderPath([]);
          }
        } else {
          setFolderPath([]);
        }

        await loadVersions(processId);

        if (data.current_version_id) {
          const xml = await loadVersionXml(processId, data.current_version_id);
          setBpmnXml(xml);
          setSelectedVersionId(data.current_version_id);
          setProcessName(data.name || 'New Process');
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
        const list: Version[] = data.versions || [];
        setVersions(list);
        setLatestVersionId(list[0]?.id || null);

        if (selectedVersionId) {
          const match = list.find((v) => v.id === selectedVersionId);
          setSelectedVersionEtag(match?.etag);
        } else if (list.length > 0) {
          setSelectedVersionId(list[0].id);
          setSelectedVersionEtag(list[0].etag);
        }
      }
    } catch (err) {
      console.error("Failed to load versions", err);
    }
  };

  const handleSave = () => {
    if (!process && !projectId && !workspaceId) {
      setToast({ message: 'No process, project, or workspace loaded to save', type: 'warning' });
      return;
    }
    setIsSaveModalOpen(true);
  };

  const performSave = async (
    params: { message: string; changeType: 'major' | 'minor' | 'patch'; force?: boolean }
  ): Promise<boolean> => {
    // If process doesn't exist yet, create it first
    let currentProcess = process;
    if (!currentProcess) {
      // Check if we have a workspace (space) to create in
      if (workspaceId && !projectId) {
        try {
          const createRes = await fetch(`${API_URL}/api/v1/spaces/${workspaceId}/processes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: processName || 'New Process',
              description: '',
              folder_id: null, // Could be enhanced to support folder_id from context
            }),
          });

          if (!createRes.ok) {
            const errBody = await createRes.json().catch(() => ({}));
            throw new Error(errBody.detail || 'Failed to create process');
          }

          const created = await createRes.json();
          currentProcess = created;
          setProcess(created);
          setProcessName(created.name || 'New Process');

          // Redirect to canonical process URL in space
          router.replace(`/spaces/${workspaceId}/processes/${created.id}`);
        } catch (err: any) {
          console.error("Create process failed:", err);
          setToast({ message: `Failed to create process: ${err.message || 'Unknown error'}`, type: 'error' });
          return false;
        }
      } else if (projectId) {
        // Legacy project-based creation
        try {
          const createRes = await fetch(`${API_URL}/api/v1/processes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              project_id: projectId,
              name: processName || 'New Process',
              description: '',
              folder_id: null,
            }),
          });

          if (!createRes.ok) {
            const errBody = await createRes.json().catch(() => ({}));
            throw new Error(errBody.detail || 'Failed to create process');
          }

          const created = await createRes.json();
          currentProcess = created;
          setProcess(created);
          setProcessName(created.name || 'New Process');

          // Redirect to canonical process URL
          // Legacy project path removed; send user to dashboard as canonical
          router.replace('/dashboard');
        } catch (err: any) {
          console.error("Create process failed:", err);
          setToast({ message: `Failed to create process: ${err.message || 'Unknown error'}`, type: 'error' });
          return false;
        }
      } else {
        setToast({ message: 'No workspace or project selected to create the process.', type: 'error' });
        return false;
      }
    }

    const processIdToUse = currentProcess?.id;
    if (!processIdToUse) {
      setToast({ message: 'Process id missing.', type: 'error' });
      return false;
    }

    const currentXml = await editorRef.current?.getXml();
    if (!currentXml) {
      throw new Error("Failed to get XML from editor");
    }
    console.log('[StudioContent] performSave - Got XML from editor, length:', currentXml.length);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    if (!params.force && selectedVersionEtag) {
      headers['If-Match'] = selectedVersionEtag;
    }

    const response = await fetch(`${API_URL}/api/v1/processes/${processIdToUse}/versions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bpmn_json: { xml: currentXml },
        version_label: `v${(versions[0]?.version_number || 0) + 1}`,
        commit_message: params.message,
        change_type: params.changeType,
        parent_version_id: selectedVersionId,
        is_active: true
      }),
    });

    if (response.status === 409) {
      let detail: any = null;
      try {
        const body = await response.json();
        detail = body?.detail || body;
      } catch (err) {
        detail = null;
      }

      setConflictInfo({
        message: detail?.message || 'Edit conflict detected.',
        yourEtag: detail?.your_etag || selectedVersionEtag,
        currentEtag: detail?.current_etag,
        lastModifiedAt: detail?.last_modified_at,
        lastModifiedBy: detail?.last_modified_by,
      });

      await loadVersions(processIdToUse);
      setToast({ message: 'Conflito de edição detectado. Reveja as mudanças antes de salvar.', type: 'error' });
      return false;
    }

    if (!response.ok) {
      throw new Error("Failed to create version");
    }

    const newVersion = await response.json();
    await loadVersions(processIdToUse);
    setSelectedVersionId(newVersion.id);
    setSelectedVersionEtag(newVersion.etag);
    setToast({ message: 'Version saved successfully!', type: 'success' });
    setIsSaveModalOpen(false);
    setConflictInfo(null);
    return true;
  };

  const handleConfirmSave = async (message: string, changeType: 'major' | 'minor' | 'patch') => {
    // Check if we have process OR projectId (for creation)
    if (!process && !projectId) return false;

    setPendingSave({ message, changeType });
    setIsSaving(true);
    try {
      return await performSave({ message, changeType });
    } catch (error: any) {
      console.error("Save failed:", error);
      setToast({ message: `Save failed: ${error.message || 'Unknown error'}`, type: 'error' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverwriteAfterConflict = async () => {
    if (!pendingSave) {
      setConflictInfo(null);
      return;
    }

    setIsSaving(true);
    try {
      await performSave({ ...pendingSave, force: true });
    } catch (error: any) {
      console.error("Overwrite failed:", error);
      setToast({ message: `Overwrite failed: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsSaving(false);
      setConflictInfo(null);
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
      const payload = {
        artifact_ids: [artifactId],
        process_name: 'Generated Process',
        project_id: projectId,
        // options can include org context in the future; keep payload minimal for now
      };

      const res = await fetch(`${API_URL}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      const xml =
        data.preview_xml ||
        data.bpmn_json?.xml ||
        data.bpmn_json?.bpmn_xml;
      if (xml) {
        setBpmnXml(xml);
      }

      if (data.process_id) {
        // Reload from API to ensure local state has project/process metadata
        await loadProcess(data.process_id);
      } else if (projectId) {
        // Keep minimal local process state so the user can keep editing
        setProcess({
          id: data.process_id || 'temporary',
          name: payload.process_name,
          project_id: projectId,
        });
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
    const match = versions.find((v) => v.id === versionId);
    setSelectedVersionEtag(match?.etag);

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
        const xml = data.xml || '';
        console.log('[StudioContent] loadVersionXml - Loaded XML length:', xml.length);
        return xml;
      }
    } catch (err) {
      console.error("Failed to load version XML", err);
    }
    return '';
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

  const [activeTab, setActiveTab] = useState<PanelTab>('wizard');

  // Tab buttons config for ResizablePanel header (History and Search)
  const headerTabs: { id: 'history' | 'search'; label: string; icon: React.ReactNode }[] = [
    { id: 'history', label: 'History', icon: <Clock className="h-3.5 w-3.5" /> },
    { id: 'search', label: 'Search', icon: <Search className="h-3.5 w-3.5" /> },
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
        projectName={projectName}
        spaceName={spaceName}
        folderPath={folderPath}
        workspaceType={workspaceType}
        projectId={projectId}
      />

      {/* Navbar 2 (Fixed) - Format Toolbar */}
      <FormatToolbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ProcessWizard Expand Button (when collapsed) */}
        {wizardPanelCollapsed && (
          <button
            onClick={() => {
              setWizardPanelCollapsed(false);
              setShowWizard(true);
            }}
            className={cn(
              'fixed right-0 top-[104px] bottom-0 z-40',
              'w-12 flex items-center justify-center',
              'bg-card border-l border-border',
              'shadow-md',
              'hover:bg-accent transition-colors',
              'text-muted-foreground hover:text-foreground'
            )}
            title="Expand Process Wizard"
          >
            <PanelRightOpen className="h-5 w-5" />
          </button>
        )}

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


        {/* ProcessWizard as separate ResizablePanel */}
        {showWizard && (
          <ResizablePanel
            defaultWidth={380}
            minWidth={320}
            maxWidth={560}
            defaultCollapsed={wizardPanelCollapsed}
            position="right"
            onCollapsedChange={(collapsed) => {
              setWizardPanelCollapsed(collapsed);
              setShowWizard(!collapsed);
              if (collapsed) {
                setActiveTab('history');
              }
            }}
            headerContent={null}
            showCollapseButton={false}
          >
            <ProcessWizard
              bpmnXml={bpmnXml || ''}
              modelVersionId={selectedVersionId || undefined}
              onEditApplied={(newBpmn, newVersionId) => {
                console.log("Edit applied", newVersionId);
                setToast({ message: 'Edit applied! Reloading...', type: 'info' });
                // Reload process to get updated XML
                if (process) {
                  loadProcess(process.id);
                }
              }}
              onCollapse={() => {
                setWizardPanelCollapsed(true);
                setShowWizard(false);
                setActiveTab('history');
              }}
            />
          </ResizablePanel>
        )}
      </div>

      {/* Modals */}
      <SaveVersionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSave}
        isSaving={isSaving}
      />

      <ConflictModal
        isOpen={!!conflictInfo}
        onClose={() => setConflictInfo(null)}
        onOverwrite={handleOverwriteAfterConflict}
        isSaving={isSaving}
        conflict={conflictInfo || undefined}
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
