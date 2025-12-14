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

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaces } from '@/contexts/SpacesContext';
import { WorkspaceType } from '@/contexts/WorkspaceContext';
import { useProcess } from '@/hooks/useProcess';
import { useVersions } from '@/hooks/useVersions';
import { apiFetch } from '@/lib/api';
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
import SearchPanel from '@/components/panels/SearchPanel';
import { Toast, ToastType } from '@/components/ui/toast';
import { ExportModal, ExportFormat, ExportOptions } from '@/components/modals/ExportModal';
import { SettingsModal, EditorSettings } from '@/components/modals/SettingsModal';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  FileText,
  Clock,
  ChevronDown,
  Search,
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
  workspaceId?: string;
  basePath: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ConflictDetail {
  message?: string;
  yourEtag?: string;
  currentEtag?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export default function StudioContent({
  processId: initialProcessId,
  workspaceId,
  basePath,
}: StudioContentProps) {

  const { token } = useAuth();
  const { spaces, deleteProcess } = useSpaces();

  const editorRef = useRef<BpmnEditorRef | null>(null);
  const router = useRouter();

  // Custom Hooks
  const {
    process: currentProcess,
    processName,
    folderPath,
    loadProcess,
    createProcess,
    setProcessName
  } = useProcess({ processId: initialProcessId, workspaceId });

  const {
    versions,
    selectedVersionId,
    selectedVersionEtag,
    bpmnXml,
    conflictInfo,
    isSaving,
    loadVersions,
    loadVersionXml,
    saveVersion,
    setSelectedVersionId,
    setBpmnXml,
    setConflictInfo
  } = useVersions(currentProcess?.id);

  // Derivations
  const localSpaceName = useMemo(() => {
    const match = spaces.find((s) => s.id === workspaceId);
    if (match) return match.name;
    if (workspaceId === 'private') return 'Private Space';
    return undefined;
  }, [spaces, workspaceId]);

  const [spaceName, setSpaceName] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ message: string; changeType: 'major' | 'minor' | 'patch' } | null>(null);

  // Restore modal state
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<any | null>(null); // Type 'Version' from hook
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  const [rightPanelMode, setRightPanelMode] = useState<'wizard' | 'search' | 'history'>('wizard');
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings | null>(null);

  const openRightPanel = (mode: 'wizard' | 'search' | 'history') => {
    setRightPanelMode(mode);
    setRightPanelCollapsed(false);
  };

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Load process initial
  useEffect(() => {
    if (initialProcessId) {
      loadProcess(initialProcessId);
    }
  }, [initialProcessId, loadProcess]);

  // Load versions if process loaded
  useEffect(() => {
    if (currentProcess?.id) {
      loadVersions(currentProcess.id);
    }
  }, [currentProcess?.id, loadVersions]);

  // Sync XML when version selected (Initial load)
  useEffect(() => {
    if (currentProcess?.current_version_id && !selectedVersionId) {
      setSelectedVersionId(currentProcess.current_version_id);
    }
  }, [currentProcess, selectedVersionId, setSelectedVersionId]);

  // Load XML when version ID changes
  useEffect(() => {
    if (currentProcess?.id && selectedVersionId) {
      loadVersionXml(currentProcess.id, selectedVersionId).catch(() => {
        setToast({ message: 'Failed to load version XML', type: 'error' });
      });
    }
  }, [currentProcess?.id, selectedVersionId, loadVersionXml]);



  // Load space name immediately when workspaceId is available
  useEffect(() => {
    if (!workspaceId) return;

    // If no token (e.g., offline/private cached), fall back to local data
    if (!token) {
      setSpaceName(localSpaceName || (workspaceId === 'private' ? 'Private Space' : 'Space'));
      return;
    }

    const loadSpaceName = async () => {
      try {
        // For 'private' space, use hardcoded name
        if (workspaceId === 'private') {
          setSpaceName('Private Space');
          return;
        }

        // For organization spaces, try to get from spaces list via API
        const spacesRes = await fetch(`${API_URL}/api/v1/spaces`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (spacesRes.ok) {
          const spacesData = await spacesRes.json();
          const space = spacesData.spaces?.find((s: { id: string }) => s.id === workspaceId);
          setSpaceName(space?.name || localSpaceName || 'Space');
        } else {
          setSpaceName(localSpaceName || 'Space');
        }
      } catch (err) {
        console.error("Failed to load space info", err);
        setSpaceName(localSpaceName || 'Space');
      }
    };
    loadSpaceName();
  }, [workspaceId, token, localSpaceName]);



  const handleSave = useCallback(() => {
    if (!currentProcess && !workspaceId) {
      setToast({ message: 'No process or workspace loaded to save', type: 'warning' });
      return;
    }
    setIsSaveModalOpen(true);
  }, [currentProcess, workspaceId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+Z / Cmd+Z - Undo
      if (ctrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.undo();
        }
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z - Redo
      if ((ctrlOrCmd && e.key === 'y') || (ctrlOrCmd && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.redo();
        }
      }

      // Ctrl+A / Cmd+A - Select All
      if (ctrlOrCmd && e.key === 'a') {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.selectAll();
        }
      }

      // Ctrl+C / Cmd+C - Copy
      if (ctrlOrCmd && e.key === 'c') {
        // Let browser handle default copy for now, but we can enhance later
        if (editorRef.current) {
          editorRef.current.copy();
        }
      }

      // Ctrl+V / Cmd+V - Paste
      if (ctrlOrCmd && e.key === 'v') {
        // Let browser handle default paste for now, but we can enhance later
        if (editorRef.current) {
          editorRef.current.paste();
        }
      }

      // Ctrl+D / Cmd+D - Duplicate
      if (ctrlOrCmd && e.key === 'd') {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.duplicate();
        }
      }

      // Ctrl+S / Cmd+S - Save
      if (ctrlOrCmd && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl+F / Cmd+F - Search
      if (ctrlOrCmd && e.key === 'f') {
        e.preventDefault();
        openRightPanel('search');
      }

      // Delete / Backspace - Delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && !ctrlOrCmd) {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.deleteSelected();
        }
      }

      // Ctrl+Plus / Cmd+Plus - Zoom in
      if (ctrlOrCmd && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.zoomIn();
        }
      }

      // Ctrl+Minus / Cmd+Minus - Zoom out
      if (ctrlOrCmd && e.key === '-') {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.zoomOut();
        }
      }

      // Ctrl+0 / Cmd+0 - Reset zoom
      if (ctrlOrCmd && e.key === '0') {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.zoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorRef, handleSave]);


  const performSave = async (params: { message: string; changeType: 'major' | 'minor' | 'patch'; force?: boolean }) => {
    // Logic for creating new process if it doesn't exist
    if (!currentProcess?.id) {
      try {
        const newProcess = await createProcess(processName || 'New Process');

        const xml = await editorRef.current?.getXml();
        if (!xml) throw new Error('Failed to get XML');

        await saveVersion(newProcess.id, xml, {
          message: 'Initial version',
          changeType: 'major',
          parentVersionId: null
        });

        router.replace(`/spaces/${workspaceId || 'private'}/processes/${newProcess.id}`);
        setToast({ message: 'Process created and saved successfully!', type: 'success' });
        return true;

      } catch (err: any) {
        console.error("Failed to create process:", err);
        setToast({ message: `Failed to create process: ${err.message}`, type: 'error' });
        return false;
      }
    }

    try {
      const xml = await editorRef.current?.getXml();
      if (!xml) throw new Error('No XML content');

      await saveVersion(currentProcess.id, xml, {
        message: params.message,
        changeType: params.changeType,
        parentVersionId: selectedVersionId,
        force: params.force
      });

      setToast({ message: 'Version saved successfully!', type: 'success' });
      setIsSaveModalOpen(false);
      setConflictInfo(null);
      return true;

    } catch (error: any) {
      console.error("Save failed:", error);
      if (error.message !== 'Conflict detected') {
        setToast({ message: `Save failed: ${error.message || 'Unknown error'}`, type: 'error' });
      } else {
        setPendingSave(params);
      }
      return false;
    }
  };

  const handleConfirmSave = async (message: string, changeType: 'major' | 'minor' | 'patch') => {
    // If no process and no workspace context, return
    if (!currentProcess && !workspaceId) return false;

    setPendingSave({ message, changeType });
    return await performSave({ message, changeType });
  };

  const handleOverwriteAfterConflict = async () => {
    if (!pendingSave) {
      setConflictInfo(null);
      return;
    }

    try {
      await performSave({ ...pendingSave, force: true });
    } catch (error: any) {
      console.error("Overwrite failed:", error);
      setToast({ message: `Overwrite failed: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setConflictInfo(null);
    }
  };


  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const performExport = async (options: ExportOptions) => {
    setIsExporting(true);
    try {
      const xml = await editorRef.current?.getXml();
      if (!xml) {
        throw new Error('Failed to get XML from editor');
      }

      const processName = currentProcess?.name || 'process';
      let blob: Blob;
      let mimeType: string;
      let extension: string;
      let filename: string;

      switch (options.format) {
        case 'xml':
          blob = new Blob([xml], { type: 'application/xml' });
          mimeType = 'application/xml';
          extension = 'bpmn';
          filename = `${processName}.${extension}`;
          break;

        case 'png':
          // Export as PNG using SVG to Canvas conversion
          try {
            const svg = await editorRef.current?.getSvg();
            if (!svg) {
              throw new Error('Failed to get SVG from editor');
            }

            // Convert SVG to PNG using canvas
            const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();

            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              img.src = url;
            });

            // Calculate scale based on DPI
            const scale = (options.pngDpi || 150) / 72; // 72 is default DPI
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }

            // Set white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convert to blob with quality
            const quality = options.pngQuality === 'low' ? 0.7 : options.pngQuality === 'medium' ? 0.85 : 0.95;
            blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((blobResult) => {
                if (!blobResult) {
                  reject(new Error('Failed to convert canvas to blob'));
                } else {
                  resolve(blobResult);
                }
              }, 'image/png', quality);
            });

            mimeType = 'image/png';
            extension = 'png';
            filename = `${processName}.${extension}`;

            URL.revokeObjectURL(url);
          } catch (err: any) {
            throw new Error(`PNG export failed: ${err.message || 'Unknown error'}`);
          }
          break;

        case 'pdf':
          // Export as PDF using SVG to PDF conversion
          try {
            const svg = await editorRef.current?.getSvg();
            if (!svg) {
              throw new Error('Failed to get SVG from editor');
            }

            // Convert SVG to image first
            const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();

            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              img.src = url;
            });

            // Calculate PDF dimensions based on page size
            const pageSizes: Record<string, { width: number; height: number }> = {
              A4: { width: 210, height: 297 }, // mm
              Letter: { width: 216, height: 279 }, // mm
              Legal: { width: 216, height: 356 }, // mm
            };

            const pageSize = pageSizes[options.pdfSize || 'A4'];
            const isLandscape = options.pdfOrientation === 'landscape';
            const pdfWidth = isLandscape ? pageSize.height : pageSize.width;
            const pdfHeight = isLandscape ? pageSize.width : pageSize.height;

            // Create canvas to convert SVG to image
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }

            // Set white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL('image/png');

            // Use jsPDF to create PDF
            const { default: jsPDF } = await import('jspdf');
            const pdf = new jsPDF({
              orientation: isLandscape ? 'landscape' : 'portrait',
              unit: 'mm',
              format: (options.pdfSize?.toLowerCase() || 'a4') as 'a4' | 'letter' | 'legal',
            });

            // Calculate image dimensions to fit page
            const imgAspectRatio = img.width / img.height;
            const pageAspectRatio = pdfWidth / pdfHeight;

            let imgWidth = pdfWidth;
            let imgHeight = pdfHeight;

            if (imgAspectRatio > pageAspectRatio) {
              // Image is wider, fit to width
              imgHeight = pdfWidth / imgAspectRatio;
            } else {
              // Image is taller, fit to height
              imgWidth = pdfHeight * imgAspectRatio;
            }

            // Center image on page
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;

            pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`${processName}.pdf`);

            URL.revokeObjectURL(url);

            setToast({ message: `Process exported as PDF successfully!`, type: 'success' });
            setIsExportModalOpen(false);
            setIsExporting(false);
            return; // Exit early
          } catch (err: any) {
            throw new Error(`PDF export failed: ${err.message || 'Unknown error'}`);
          }

        case 'json':
          // Convert XML to JSON (simplified - would need proper parser)
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, 'application/xml');
            const jsonData = {
              process: {
                id: doc.querySelector('bpmn\\:process, process')?.getAttribute('id') || 'process',
                name: doc.querySelector('bpmn\\:process, process')?.getAttribute('name') || processName,
              },
              xml: xml,
              exportedAt: new Date().toISOString(),
              version: options.includeVersion ? selectedVersionId : undefined,
            };
            blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            mimeType = 'application/json';
            extension = 'bpmn.json';
            filename = `${processName}.${extension}`;
          } catch (err) {
            throw new Error('Failed to convert XML to JSON');
          }
          break;

        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToast({ message: `Process exported as ${options.format.toUpperCase()} successfully!`, type: 'success' });
      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error('Export failed:', err);
      setToast({ message: `Export failed: ${err.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };



  const handleActivateVersion = async (versionId: string) => {
    if (!currentProcess) return;

    try {
      await apiFetch(`/api/v1/processes/${currentProcess.id}/versions/${versionId}/activate`, {
        method: 'PUT',
        token
      });

      await loadVersions(currentProcess.id);
      setToast({ message: 'Version activated successfully!', type: 'success' });

    } catch (error: any) {
      console.error("Failed to activate version:", error);
      setToast({ message: `Failed to activate version: ${error.message || 'Unknown error'}`, type: 'error' });
    }
  };



  const handleSelectVersion = async (versionId: string) => {
    setSelectedVersionId(versionId);

    // hook doesn't expose setter, relying on selectedVersionId update


    if (currentProcess?.id) {
      // setIsLoadingVersion(true); // Hook doesn't expose this yet but we can add or ignore for now
      try {
        await loadVersionXml(currentProcess.id, versionId);
      } catch (err) {
        setToast({ message: 'Failed to load version', type: 'error' });
      } finally {
        // setIsLoadingVersion(false);
      }
    }
  };



  // Removed duplicate loadVersionXml - usage replaced by hook's loadVersionXml




  const handleRestoreVersion = async (commitMessage?: string) => {
    if (!currentProcess || !versionToRestore) return;

    setIsRestoring(true);
    try {
      const restoredVersion = await apiFetch(`/api/v1/processes/${currentProcess.id}/versions/${versionToRestore.id}/restore`, {
        method: 'POST',
        token,
        body: JSON.stringify({ commit_message: commitMessage })
      });

      await loadVersions(currentProcess.id);
      setSelectedVersionId(restoredVersion.id);

      // Reload xml for restored
      const versionData = await loadVersionXml(currentProcess.id, restoredVersion.id);
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






  const handleOpenHistoryFromSettings = () => {
    setRightPanelMode('history');
    setRightPanelCollapsed(false);
    setIsSettingsModalOpen(false);
  };

  const handleDeleteProcess = useCallback(async () => {
    if (!currentProcess || !workspaceId) return;
    const confirmed = window.confirm('Delete this process? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteProcess(workspaceId, currentProcess.id);
      setToast({ message: 'Process deleted', type: 'success' });
      const redirect = currentProcess.folder_id ? `${basePath}/folders/${currentProcess.folder_id}` : basePath;
      router.push(redirect);
    } catch (err: any) {
      console.error('Failed to delete process', err);
      setToast({ message: err?.message || 'Error deleting process', type: 'error' });
    }
  }, [basePath, deleteProcess, currentProcess, router, workspaceId]);

  const handleToggleWizardPanel = () => {
    if (rightPanelMode === 'wizard' && !rightPanelCollapsed) {
      setRightPanelCollapsed(true);
      return;
    }
    setRightPanelMode('wizard');
    setRightPanelCollapsed(false);
  };

  const isWizardPanelOpen = rightPanelMode === 'wizard' && !rightPanelCollapsed;

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Professional Navbar */}
      <StudioNavbar
        process={currentProcess}
        versions={versions}
        selectedVersionId={selectedVersionId}
        basePath={basePath}
        isSaving={isSaving}
        onSave={handleSave}
        onExport={handleExport}
        onActivateVersion={handleActivateVersion}
        spaceName={spaceName}
        folderPath={folderPath}
        editorRef={editorRef}
        onSearchClick={() => openRightPanel('search')}
        onDeleteProcess={currentProcess?.id ? () => handleDeleteProcess() : undefined}
      />

      {/* Navbar 2 (Fixed) - Format Toolbar */}
      <FormatToolbar
        editorRef={editorRef}
        selectedElements={selectedElements}
        onWizardClick={handleToggleWizardPanel}
        isWizardOpen={isWizardPanelOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center: Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* BPMN Editor Canvas */}
          <div className="flex-1 bg-muted/30 overflow-hidden relative">
            {isLoadingVersion && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center pointer-events-auto">
                <div className="text-center pointer-events-none">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading version...</p>
                </div>
              </div>
            )}
            <BpmnEditor
              ref={editorRef}
              initialXml={bpmnXml}
              onSelectionChange={(elements) => {
                setSelectedElements(elements);
              }}
            />
          </div>
        </div>


        {/* Right Panel (Wizard / Search / History) */}
        <ResizablePanel
          key={`${rightPanelMode}-${rightPanelCollapsed ? 'c' : 'o'}`}
          defaultWidth={380}
          minWidth={320}
          maxWidth={560}
          defaultCollapsed={rightPanelCollapsed}
          position="right"
          onCollapsedChange={(collapsed) => {
            setRightPanelCollapsed(collapsed);
          }}
          headerContent={null}
          showCollapseButton={false}
        >
          {rightPanelMode === 'wizard' && (
            <ProcessWizard
              bpmnXml={bpmnXml || ''}
              modelVersionId={selectedVersionId || undefined}
              onEditApplied={(newBpmn, newVersionId) => {
                console.log("Edit applied", newVersionId);
                setToast({ message: 'Edit applied! Reloading...', type: 'info' });
                if (currentProcess) {
                  loadProcess(currentProcess.id);
                }
              }}
            />
          )}
          {rightPanelMode === 'history' && versions.length > 0 && (
            <VersionTimeline
              versions={versions}
              selectedVersionId={selectedVersionId}
              onSelectVersion={(versionId) => {
                handleSelectVersion(versionId);
              }}
              onRestoreVersion={(versionId) => {
                const version = versions.find(v => v.id === versionId);
                if (version) {
                  setVersionToRestore(version);
                  setIsRestoreModalOpen(true);
                }
              }}
            />
          )}
          {rightPanelMode === 'search' && (
            <SearchPanel
              editorRef={editorRef as React.RefObject<BpmnEditorRef>}
              onClose={() => {
                setRightPanelCollapsed(true);
              }}
            />
          )}
        </ResizablePanel>
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

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={performExport}
        processName={currentProcess?.name || processName}
        isExporting={isExporting}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenHistory={handleOpenHistoryFromSettings}
        onSettingsChange={(settings) => {
          setEditorSettings(settings);
          // Apply settings to editor
          if (editorRef?.current) {
            editorRef.current.applySettings({
              gridSnap: settings.gridSnap,
              gridSize: settings.gridSize,
              zoomMin: settings.zoomMin,
              zoomMax: settings.zoomMax,
            });
          }
        }}
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
