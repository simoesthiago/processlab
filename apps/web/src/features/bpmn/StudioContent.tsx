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

import { useRef, useState, useEffect, useCallback } from 'react';
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
  projectId?: string;
  workspaceId?: string;
  workspaceType?: WorkspaceType;
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
  projectId,
  workspaceId,
  workspaceType,
  basePath,
}: StudioContentProps) {
  const editorRef = useRef<BpmnEditorRef>(null);
  const router = useRouter();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // State
  const [process, setProcess] = useState<Process | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedVersionEtag, setSelectedVersionEtag] = useState<string | undefined>(undefined);
  const [latestVersionId, setLatestVersionId] = useState<string | null>(null);
  const [bpmnXml, setBpmnXml] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
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
  const [rightPanelMode, setRightPanelMode] = useState<'wizard' | 'search' | 'history'>('wizard');
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings | null>(null);

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

  const handleSave = useCallback(() => {
    if (!process && !projectId && !workspaceId) {
      setToast({ message: 'No process, project, or workspace loaded to save', type: 'warning' });
      return;
    }
    setIsSaveModalOpen(true);
  }, [process, projectId, workspaceId]);

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

      const processName = process?.name || 'process';
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

  const openRightPanel = (mode: 'wizard' | 'search' | 'history') => {
    setRightPanelMode(mode);
    setRightPanelCollapsed(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Professional Navbar */}
      <StudioNavbar
        process={process}
        versions={versions}
        selectedVersionId={selectedVersionId}
        basePath={basePath}
        isSaving={isSaving}
        onSave={handleSave}
        onExport={handleExport}
        onActivateVersion={handleActivateVersion}
        projectName={projectName}
        spaceName={spaceName}
        folderPath={folderPath}
        workspaceType={workspaceType}
        projectId={projectId}
        editorRef={editorRef}
      />

      {/* Navbar 2 (Fixed) - Format Toolbar */}
      <FormatToolbar 
        editorRef={editorRef} 
        selectedElements={selectedElements}
        onWizardClick={() => openRightPanel('wizard')}
        onHistoryClick={() => openRightPanel('history')}
        onSearchClick={() => openRightPanel('search')}
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
                if (process) {
                  loadProcess(process.id);
                }
              }}
              onCollapse={() => {
                setRightPanelCollapsed(true);
              }}
            />
          )}
          {rightPanelMode === 'history' && (
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
              editorRef={editorRef}
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
        processName={process?.name || processName}
        isExporting={isExporting}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
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
