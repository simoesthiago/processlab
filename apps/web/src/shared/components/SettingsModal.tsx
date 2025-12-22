'use client';

/**
 * Settings Modal Component
 * 
 * Modal for configuring editor settings:
 * - Editor (grid snap, grid size, zoom, auto-save)
 * - Visual (theme, default colors, font size)
 * - Keyboard Shortcuts (list and customization)
 * - Export (default format and quality)
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/shared/components/ui/tabs';
import {
  Settings,
  Grid3x3,
  ZoomIn,
  Save,
  Palette,
  Keyboard,
  Download,
  X,
  Clock,
} from 'lucide-react';

export interface EditorSettings {
  // Editor
  gridSnap: boolean;
  gridSize: number;
  zoomMin: number;
  zoomMax: number;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  
  // Visual
  theme: 'light' | 'dark' | 'system';
  defaultElementColor: string;
  defaultTextColor: string;
  defaultFontSize: number;
  
  // Export
  defaultExportFormat: 'xml' | 'png' | 'pdf' | 'json';
  defaultPngQuality: 'low' | 'medium' | 'high';
  defaultPngDpi: 72 | 150 | 300;
  defaultPdfSize: 'A4' | 'Letter' | 'Legal';
  defaultPdfOrientation: 'portrait' | 'landscape';
}

export interface KeyboardShortcut {
  action: string;
  keys: string;
  description: string;
}

const DEFAULT_SETTINGS: EditorSettings = {
  gridSnap: true,
  gridSize: 20,
  zoomMin: 20,
  zoomMax: 300,
  autoSave: false,
  autoSaveInterval: 30,
  theme: 'system',
  defaultElementColor: '#ffffff',
  defaultTextColor: '#000000',
  defaultFontSize: 11,
  defaultExportFormat: 'png',
  defaultPngQuality: 'high',
  defaultPngDpi: 150,
  defaultPdfSize: 'A4',
  defaultPdfOrientation: 'portrait',
};

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { action: 'Undo', keys: 'Ctrl+Z / Cmd+Z', description: 'Undo last action' },
  { action: 'Redo', keys: 'Ctrl+Y / Cmd+Y', description: 'Redo last action' },
  { action: 'Select All', keys: 'Ctrl+A / Cmd+A', description: 'Select all elements' },
  { action: 'Copy', keys: 'Ctrl+C / Cmd+C', description: 'Copy selected elements' },
  { action: 'Paste', keys: 'Ctrl+V / Cmd+V', description: 'Paste elements' },
  { action: 'Duplicate', keys: 'Ctrl+D / Cmd+D', description: 'Duplicate selected elements' },
  { action: 'Delete', keys: 'Delete / Backspace', description: 'Delete selected elements' },
  { action: 'Save', keys: 'Ctrl+S / Cmd+S', description: 'Save process' },
  { action: 'Search', keys: 'Ctrl+F / Cmd+F', description: 'Open search panel' },
  { action: 'Zoom In', keys: 'Ctrl++ / Cmd++', description: 'Zoom in' },
  { action: 'Zoom Out', keys: 'Ctrl+- / Cmd+-', description: 'Zoom out' },
  { action: 'Reset Zoom', keys: 'Ctrl+0 / Cmd+0', description: 'Reset zoom to 100%' },
];

const STORAGE_KEY = 'processlab-editor-settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: EditorSettings) => void;
  onOpenHistory?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSettingsChange,
  onOpenHistory,
}: SettingsModalProps) {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('editor');

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Failed to parse saved settings:', e);
        }
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    // Call onSettingsChange only when settings actually change, not when callback changes
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Editor Settings
          </DialogTitle>
          <DialogDescription>
            Configure editor preferences, visual settings, keyboard shortcuts, and export defaults.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editor" className="flex items-center gap-1.5">
              <Grid3x3 className="h-3.5 w-3.5" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="grid-snap">Grid Snap</Label>
                  <p className="text-xs text-muted-foreground">
                    Snap elements to grid when moving
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('gridSnap', !settings.gridSnap)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.gridSnap ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.gridSnap ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grid-size">Grid Size</Label>
                <Input
                  id="grid-size"
                  type="number"
                  min="5"
                  max="50"
                  value={settings.gridSize}
                  onChange={(e) =>
                    updateSetting('gridSize', parseInt(e.target.value) || 20)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Size of the grid in pixels (5-50)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zoom-min">Minimum Zoom (%)</Label>
                  <Input
                    id="zoom-min"
                    type="number"
                    min="10"
                    max="100"
                    value={settings.zoomMin}
                    onChange={(e) =>
                      updateSetting('zoomMin', parseInt(e.target.value) || 20)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoom-max">Maximum Zoom (%)</Label>
                  <Input
                    id="zoom-max"
                    type="number"
                    min="100"
                    max="500"
                    value={settings.zoomMax}
                    onChange={(e) =>
                      updateSetting('zoomMax', parseInt(e.target.value) || 300)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto-save</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save changes periodically
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('autoSave', !settings.autoSave)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.autoSave ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {settings.autoSave && (
                <div className="space-y-2">
                  <Label htmlFor="auto-save-interval">Auto-save Interval (seconds)</Label>
                  <Input
                    id="auto-save-interval"
                    type="number"
                    min="10"
                    max="300"
                    value={settings.autoSaveInterval}
                    onChange={(e) =>
                      updateSetting('autoSaveInterval', parseInt(e.target.value) || 30)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    How often to auto-save (10-300 seconds)
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Visual Tab */}
          <TabsContent value="visual" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) =>
                    updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')
                  }
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-sm transition-all duration-200 focus:border-black focus:ring-black focus:outline-none focus:ring-1"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color theme
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-element-color">Default Element Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="default-element-color"
                      type="color"
                      value={settings.defaultElementColor}
                      onChange={(e) =>
                        updateSetting('defaultElementColor', e.target.value)
                      }
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.defaultElementColor}
                      onChange={(e) =>
                        updateSetting('defaultElementColor', e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-text-color">Default Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="default-text-color"
                      type="color"
                      value={settings.defaultTextColor}
                      onChange={(e) =>
                        updateSetting('defaultTextColor', e.target.value)
                      }
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.defaultTextColor}
                      onChange={(e) =>
                        updateSetting('defaultTextColor', e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-font-size">Default Font Size</Label>
                <Input
                  id="default-font-size"
                  type="number"
                  min="8"
                  max="24"
                  value={settings.defaultFontSize}
                  onChange={(e) =>
                    updateSetting('defaultFontSize', parseInt(e.target.value) || 11)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Default font size for new elements (8-24)
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Keyboard Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Keyboard shortcuts for quick actions. Customization coming soon.
              </p>
              <div className="border rounded-lg divide-y">
                {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{shortcut.action}</div>
                      <div className="text-xs text-muted-foreground">
                        {shortcut.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.split(' / ').map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Open the version history panel to review and restore previous versions of the process.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenHistory?.();
                  onClose();
                }}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Open Version History
              </Button>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-export-format">Default Export Format</Label>
                <select
                  id="default-export-format"
                  value={settings.defaultExportFormat}
                  onChange={(e) =>
                    updateSetting(
                      'defaultExportFormat',
                      e.target.value as 'xml' | 'png' | 'pdf' | 'json'
                    )
                  }
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-sm transition-all duration-200 focus:border-black focus:ring-black focus:outline-none focus:ring-1"
                >
                  <option value="xml">BPMN XML</option>
                  <option value="png">PNG Image</option>
                  <option value="pdf">PDF Document</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              {settings.defaultExportFormat === 'png' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="default-png-quality">PNG Quality</Label>
                    <select
                      id="default-png-quality"
                      value={settings.defaultPngQuality}
                      onChange={(e) =>
                        updateSetting(
                          'defaultPngQuality',
                          e.target.value as 'low' | 'medium' | 'high'
                        )
                      }
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-sm transition-all duration-200 focus:border-black focus:ring-black focus:outline-none focus:ring-1"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-png-dpi">PNG DPI</Label>
                    <select
                      id="default-png-dpi"
                      value={settings.defaultPngDpi}
                      onChange={(e) =>
                        updateSetting(
                          'defaultPngDpi',
                          parseInt(e.target.value) as 72 | 150 | 300
                        )
                      }
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-sm transition-all duration-200 focus:border-black focus:ring-black focus:outline-none focus:ring-1"
                    >
                      <option value="72">72 DPI</option>
                      <option value="150">150 DPI</option>
                      <option value="300">300 DPI</option>
                    </select>
                  </div>
                </>
              )}

              {settings.defaultExportFormat === 'pdf' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="default-pdf-size">PDF Page Size</Label>
                    <select
                      id="default-pdf-size"
                      value={settings.defaultPdfSize}
                      onChange={(e) =>
                        updateSetting(
                          'defaultPdfSize',
                          e.target.value as 'A4' | 'Letter' | 'Legal'
                        )
                      }
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-sm transition-all duration-200 focus:border-black focus:ring-black focus:outline-none focus:ring-1"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-pdf-orientation">PDF Orientation</Label>
                    <select
                      id="default-pdf-orientation"
                      value={settings.defaultPdfOrientation}
                      onChange={(e) =>
                        updateSetting(
                          'defaultPdfOrientation',
                          e.target.value as 'portrait' | 'landscape'
                        )
                      }
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-sm transition-all duration-200 focus:border-black focus:ring-black focus:outline-none focus:ring-1"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

