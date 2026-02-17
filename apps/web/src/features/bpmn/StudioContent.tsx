'use client';

/**
 * Studio Content Component
 * 
 * Redesigned BPMN Editor workspace with:
 * - Professional navbar integrated with app design
 * - Separate elements sidebar (not overlapping canvas)
 * - Collapsible and resizable Process Wizard panel
 * - Consistent color palette with ProcessLab design system
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaces } from '@/contexts/SpacesContext';
import { useProcess } from '@/features/processes/hooks/useProcess';
import { useVersions } from '@/features/processes/hooks/useVersions';
import { apiFetch, API_URL } from '@/shared/services/api/client';
import { StudioNavbar } from '@/shared/components/layout/StudioNavbar';
import { FormatToolbar } from '@/shared/components/layout/FormatToolbar';
import { ResizablePanel } from '@/shared/components/ui/resizable-panel';
import SaveVersionModal from '@/features/versioning/SaveVersionModal';
import BpmnEditor, { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';
import ProcessWizard from '@/features/processwizard/ProcessWizard';
import SearchPanel from '@/shared/components/SearchPanel';
import { Toast, ToastType } from '@/shared/components/ui/toast';
import { ExportModal, ExportFormat, ExportOptions } from '@/shared/components/ExportModal';
import { SettingsModal, EditorSettings } from '@/shared/components/SettingsModal';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Wand2,
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



export default function StudioContent({
  processId: initialProcessId,
  workspaceId,
  basePath,
}: StudioContentProps) {

  const { token, loading: authLoading } = useAuth();
  const { spaces, deleteProcess } = useSpaces();

  const editorRef = useRef<BpmnEditorRef | null>(null);
  const router = useRouter();

  // Custom Hooks
  const {
    process: currentProcess,
    processName,
    loadProcess,
    createProcess,
    setProcessName,
    error: processError,
  } = useProcess({ processId: initialProcessId, workspaceId });

  const {
    versions,
    selectedVersionId,
    selectedVersionEtag,
    bpmnXml,
    isSaving,
    loadVersions,
    loadVersionXml,
    saveVersion,
    setSelectedVersionId,
    setBpmnXml
  } = useVersions(currentProcess?.id);

  // Derivations
  const localSpaceName = useMemo(() => {
    const match = spaces.find((s: { id: string }) => s.id === workspaceId);
    if (match) return match.name;
    if (workspaceId === 'private') return 'Private Space';
    return undefined;
  }, [spaces, workspaceId]);

  const [spaceName, setSpaceName] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const [rightPanelMode, setRightPanelMode] = useState<'wizard' | 'search'>('wizard');
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [canvasHasElements, setCanvasHasElements] = useState(false);

  // Memoize selection change handler to prevent infinite loops
  const handleSelectionChange = useCallback((elements: any[]) => {
    setSelectedElements(elements);
    // Update canvas emptiness by counting DOM shapes (fastest, no registry timing issues)
    setTimeout(() => {
      const shapeCount = document.querySelectorAll('.djs-element.djs-shape').length;
      setCanvasHasElements(shapeCount > 0);
    }, 30);
  }, []);

  // Memoize settings change handler to prevent infinite loops
  const handleSettingsChange = useCallback((settings: EditorSettings) => {
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
  }, []);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings | null>(null);
  // BYOK: key lives only in React state, never persisted
  const [openAiKey, setOpenAiKey] = useState('');

  const openRightPanel = (mode: 'wizard' | 'search') => {
    setRightPanelMode(mode);
    setRightPanelCollapsed(false);
  };

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Load process initial - apenas se token estiver disponível
  // O useProcess já tem lógica para recarregar quando o token ficar disponível
  // Adicionar delay para processos recém-criados (pode ser race condition)
  useEffect(() => {
    if (initialProcessId && token && !authLoading) {
      // Se não temos processo carregado OU o processo atual tem ID diferente, carregar
      if (!currentProcess || currentProcess.id !== initialProcessId) {
        // Se não temos processo carregado, pode ser um processo recém-criado
        // Adicionar delay para evitar race condition
        if (!currentProcess) {
          setTimeout(() => {
            loadProcess(initialProcessId);
          }, 400);
        } else {
          loadProcess(initialProcessId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProcessId, token, authLoading, loadProcess]); // Removido currentProcess das dependências para evitar loop

  // Load versions if process loaded (silent mode to prevent UI breaking)
  useEffect(() => {
    if (currentProcess?.id) {
      loadVersions(currentProcess.id, true).catch(() => {
        // Silently handle errors - versions will be empty but UI won't break
      });
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
      loadVersionXml(selectedVersionId).catch(() => {
        setToast({ message: 'Failed to load version XML', type: 'error' });
      });
    }
  }, [currentProcess?.id, selectedVersionId, loadVersionXml]);

  // Sync canvas empty state from loaded XML
  useEffect(() => {
    if (bpmnXml) {
      setCanvasHasElements(bpmnXml.includes('BPMNShape'));
    } else {
      setCanvasHasElements(false);
    }
  }, [bpmnXml]);

  // Poll DOM for BPMN shapes to keep canvasHasElements accurate regardless of events
  useEffect(() => {
    const interval = setInterval(() => {
      const count = document.querySelectorAll('.djs-element.djs-shape').length;
      setCanvasHasElements(count > 0);
    }, 500);
    return () => clearInterval(interval);
  }, []);



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

        // Convert XML to a simple JSON structure for the API
        // The API expects bpmn_json, so we create a minimal structure
        const bpmnJson = {
          xml: xml,
          process: {
            id: newProcess.id,
            name: newProcess.name || 'New Process',
          },
          elements: [],
          flows: [],
        };

        // Use API directly since useVersions hook doesn't have the new processId yet
        await apiFetch(`/api/v1/processes/${newProcess.id}/versions`, {
          method: 'POST',
          body: JSON.stringify({
            bpmn_json: bpmnJson,
            commit_message: 'Initial version',
            change_type: 'major',
          }),
        });

        // Small delay to ensure process is fully committed before navigation
        await new Promise(resolve => setTimeout(resolve, 200));
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
      // Small delay to ensure all changes are committed to the modeler
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const xml = await editorRef.current?.getXml();
      if (!xml) throw new Error('No XML content');

      console.log('[StudioContent] Saving XML, length:', xml.length);
      console.log('[StudioContent] XML preview (first 500 chars):', xml.substring(0, 500));
      
      // Check if XML is empty (only has basic structure)
      const hasElements = xml.includes('<bpmn2:') && (
        xml.includes('task') || 
        xml.includes('event') || 
        xml.includes('gateway') ||
        xml.includes('sequenceFlow') ||
        xml.includes('BPMNShape') ||
        xml.includes('BPMNEdge')
      );
      
      if (!hasElements) {
        console.warn('[StudioContent] Warning: XML appears to be empty (no elements found)');
      }

      // Convert XML to a simple JSON structure for the API
      const bpmnJson = {
        xml: xml,
        process: {
          id: currentProcess.id,
          name: currentProcess.name || 'Process',
        },
        elements: [],
        flows: [],
      };

      await saveVersion(bpmnJson, params.message, params.changeType);

      setToast({ message: 'Version saved successfully!', type: 'success' });
      setIsSaveModalOpen(false);
      return true;

    } catch (error: any) {
      console.error("Save failed:", error);
      setToast({ message: `Save failed: ${error.message || 'Unknown error'}`, type: 'error' });
      return false;
    }
  };

  const handleConfirmSave = async (message: string, changeType: 'major' | 'minor' | 'patch') => {
    // If no process and no workspace context, return
    if (!currentProcess && !workspaceId) return false;

    return await performSave({ message, changeType });
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



  const handleSelectVersion = async (versionId: string) => {
    setSelectedVersionId(versionId);

    if (currentProcess?.id) {
      try {
        await loadVersionXml(versionId);
      } catch (err) {
        setToast({ message: 'Failed to load version', type: 'error' });
      }
    }
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
        basePath={basePath}
        workspaceId={workspaceId}
        folderId={currentProcess?.folder_id ?? null}
        isSaving={isSaving}
        onSave={handleSave}
        onExport={handleExport}
        spaceName={spaceName}
        editorRef={editorRef}
        onSearchClick={() => openRightPanel('search')}
        onDeleteProcess={currentProcess?.id ? () => handleDeleteProcess() : undefined}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
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
            {processError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <div className="max-w-md p-8 bg-card rounded-xl border border-border shadow-2xl text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
                    <Search className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Process Not Found</h2>
                  <p className="text-muted-foreground mb-6">
                    {processError || "We couldn't find the process you're looking for. It might have been moved or deleted."}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => router.push(basePath)}
                      className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Back to Space
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <BpmnEditor
                  ref={editorRef}
                  initialXml={bpmnXml ?? undefined}
                  onSelectionChange={handleSelectionChange}
                  key={selectedVersionId || 'new'} // Force re-render when version changes
                />
                {/* Canvas Empty State — shown when diagram has no elements */}
                {!canvasHasElements && (!bpmnXml || !bpmnXml.includes('BPMNShape')) && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center border border-border/60">
                      <Wand2 className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground/70">Your canvas is empty</p>
                      <p className="text-xs text-muted-foreground/50 mt-1 max-w-[260px]">Drag elements from the palette or use the Process Wizard to get started</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Right Panel (Wizard / Search / History) */}
        <ResizablePanel
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
              openAiKey={openAiKey}
              onEditApplied={(newBpmn, newVersionId) => {
                console.log("Edit applied", newVersionId);
                setToast({ message: 'Edit applied! Reloading...', type: 'info' });
                if (currentProcess) {
                  loadProcess(currentProcess.id);
                }
              }}
            />
          )}
          {rightPanelMode === 'search' && (
            <SearchPanel
              editorRef={editorRef as React.RefObject<BpmnEditorRef>}
              onClose={() => {
                setRightPanelCollapsed(true);
                setRightPanelMode('wizard');
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
        currentVersionNumber={versions[0]?.version_number}
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
        onSettingsChange={handleSettingsChange}
        onApiKeyChange={setOpenAiKey}
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
