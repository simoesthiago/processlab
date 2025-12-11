'use client';

/**
 * Export Modal Component
 * 
 * Modal for exporting BPMN processes in different formats (XML, PNG, PDF, JSON)
 * with configurable options for each format.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Image,
  FileJson,
  Download,
  X,
  Loader2,
} from 'lucide-react';

export type ExportFormat = 'xml' | 'png' | 'pdf' | 'json';

interface ExportOptions {
  format: ExportFormat;
  // PNG options
  pngQuality?: 'low' | 'medium' | 'high';
  pngDpi?: 72 | 150 | 300;
  // PDF options
  pdfSize?: 'A4' | 'Letter' | 'Legal';
  pdfOrientation?: 'portrait' | 'landscape';
  pdfMargins?: number;
  // XML options
  includeMetadata?: boolean;
  // JSON options
  includeVersion?: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  processName?: string;
  isExporting?: boolean;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  processName = 'process',
  isExporting = false,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('xml');
  const [pngQuality, setPngQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [pngDpi, setPngDpi] = useState<72 | 150 | 300>(150);
  const [pdfSize, setPdfSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeVersion, setIncludeVersion] = useState(true);

  if (!isOpen) return null;

  const handleExport = async () => {
    const options: ExportOptions = {
      format,
      pngQuality: format === 'png' ? pngQuality : undefined,
      pngDpi: format === 'png' ? pngDpi : undefined,
      pdfSize: format === 'pdf' ? pdfSize : undefined,
      pdfOrientation: format === 'pdf' ? pdfOrientation : undefined,
      includeMetadata: format === 'xml' ? includeMetadata : undefined,
      includeVersion: format === 'json' ? includeVersion : undefined,
    };

    await onExport(options);
  };

  const formatOptions = [
    { value: 'xml' as ExportFormat, label: 'BPMN XML', icon: FileText, description: 'BPMN 2.0 XML format' },
    { value: 'png' as ExportFormat, label: 'PNG Image', icon: Image, description: 'Raster image format' },
    { value: 'pdf' as ExportFormat, label: 'PDF Document', icon: FileText, description: 'Portable document format' },
    { value: 'json' as ExportFormat, label: 'JSON', icon: FileJson, description: 'Internal JSON format' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl border border-border max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Export Process</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose format and options for exporting "{processName}"
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Format Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = format === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                    disabled={isExporting}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-background',
                      isExporting && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <div>
                        <div className={cn(
                          'font-medium',
                          isSelected ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format-specific options */}
          <div className="space-y-4">
            {/* PNG Options */}
            {format === 'png' && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Quality
                  </label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setPngQuality(quality)}
                        disabled={isExporting}
                        className={cn(
                          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                          pngQuality === quality
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent',
                          isExporting && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Resolution (DPI)
                  </label>
                  <div className="flex gap-2">
                    {([72, 150, 300] as const).map((dpi) => (
                      <button
                        key={dpi}
                        onClick={() => setPngDpi(dpi)}
                        disabled={isExporting}
                        className={cn(
                          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                          pngDpi === dpi
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent',
                          isExporting && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {dpi} DPI
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* PDF Options */}
            {format === 'pdf' && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Page Size
                  </label>
                  <div className="flex gap-2">
                    {(['A4', 'Letter', 'Legal'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setPdfSize(size)}
                        disabled={isExporting}
                        className={cn(
                          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                          pdfSize === size
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent',
                          isExporting && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Orientation
                  </label>
                  <div className="flex gap-2">
                    {(['portrait', 'landscape'] as const).map((orientation) => (
                      <button
                        key={orientation}
                        onClick={() => setPdfOrientation(orientation)}
                        disabled={isExporting}
                        className={cn(
                          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                          pdfOrientation === orientation
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent',
                          isExporting && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* XML Options */}
            {format === 'xml' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeMetadata"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  disabled={isExporting}
                  className="rounded border-border"
                />
                <label htmlFor="includeMetadata" className="text-sm text-foreground">
                  Include metadata and version information
                </label>
              </div>
            )}

            {/* JSON Options */}
            {format === 'json' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeVersion"
                  checked={includeVersion}
                  onChange={(e) => setIncludeVersion(e.target.checked)}
                  disabled={isExporting}
                  className="rounded border-border"
                />
                <label htmlFor="includeVersion" className="text-sm text-foreground">
                  Include version information
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

