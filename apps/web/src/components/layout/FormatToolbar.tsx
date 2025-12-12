'use client';

/**
 * Format Toolbar Component
 * 
 * Toolbar with formatting options for BPMN elements:
 * - Font, Font Size
 * - Text formatting (bold, italic, underline, etc.)
 * - Text Color and Fill Color (separate selectors)
 * - Alignment options
 * - Arrange, Simulation, Search, History
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Play,
  Sparkles,
  ChevronDown,
  Type,
  PaintBucket,
  Search,
  Clock,
  Palette,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Layers,
  Layers3,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react';

import { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';

interface FormatToolbarProps {
  className?: string;
  editorRef?: React.RefObject<BpmnEditorRef | null>;
  selectedElements?: any[];
  onWizardClick?: () => void;
  onHistoryClick?: () => void;
  onSearchClick?: () => void;
}

export function FormatToolbar({ className, editorRef, selectedElements = [], onWizardClick, onHistoryClick, onSearchClick }: FormatToolbarProps) {
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState('11');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState('#000000');
  const [selectedFillColor, setSelectedFillColor] = useState('#ffffff');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'middle' | 'bottom'>('middle');
  
  // Dropdown states (controlled by click, not just hover)
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const [isTextColorMenuOpen, setIsTextColorMenuOpen] = useState(false);
  const [isFillColorMenuOpen, setIsFillColorMenuOpen] = useState(false);
  const [isHorizontalAlignMenuOpen, setIsHorizontalAlignMenuOpen] = useState(false);
  const [isVerticalAlignMenuOpen, setIsVerticalAlignMenuOpen] = useState(false);
  const [isArrangeMenuOpen, setIsArrangeMenuOpen] = useState(false);
  
  // Allow toolbar interactions even quando não há seleção
  const hasSelection = true;

  // Theme palette columns (5 tons verticais, como no exemplo)
  const themeColumns = [
    ['#ffffff', '#f2f2f2', '#e5e5e5', '#d9d9d9', '#bfbfbf'], // neutro claro
    ['#000000', '#111111', '#222222', '#333333', '#444444'], // neutro escuro
    ['#334a68', '#3f5778', '#4a6487', '#557196', '#607da5'], // azul escuro
    ['#cd6a2e', '#d5783c', '#de864c', '#e6945c', '#eea36d'], // laranja
    ['#7a7a7a', '#8a8a8a', '#9a9a9a', '#aaaaaa', '#bcbcbc'], // cinza médio
    ['#dca410', '#e6b021', '#efbe35', '#f6cb4a', '#f9d867'], // amarelo
    ['#2f83c7', '#3990d4', '#439ce1', '#4da8ee', '#57b4fb'], // azul
    ['#5d9c55', '#69a961', '#74b56d', '#7fc279', '#8acf85'], // verde
  ];

  const standardColors = [
    '#c62828', '#ef5350', '#f9a825', '#ffd54f', '#8bc34a',
    '#43a047', '#00acc1', '#1e88e5', '#1565c0', '#5e35b1',
  ];

  const [recentColors, setRecentColors] = useState<string[]>([]);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const fillColorInputRef = useRef<HTMLInputElement>(null);
  const updateRecentColors = (color: string) => {
    setRecentColors((prev) => {
      const next = [color, ...prev.filter((c) => c !== color)];
      return next.slice(0, 10);
    });
  };

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana'];
  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24'];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Get the toolbar container
      const toolbar = target.closest('[data-format-toolbar]');
      if (!toolbar) {
        // Clicked completely outside toolbar, close all dropdowns
        setIsFontMenuOpen(false);
        setIsFontSizeMenuOpen(false);
        setIsTextColorMenuOpen(false);
        setIsFillColorMenuOpen(false);
        setIsHorizontalAlignMenuOpen(false);
        setIsVerticalAlignMenuOpen(false);
        setIsArrangeMenuOpen(false);
        return;
      }
      
      // Check if click is inside any dropdown menu (not the button)
      const clickedInsideDropdownMenu = target.closest('[data-dropdown-menu]');
      const clickedOnDropdownButton = target.closest('.format-toolbar-dropdown button');
      
      // If clicking on a dropdown button, don't close (let the button handler manage it)
      if (clickedOnDropdownButton) {
        return;
      }
      
      // If clicking inside a dropdown menu, don't close
      if (clickedInsideDropdownMenu) {
        return;
      }
      
      // Clicked in toolbar but outside dropdowns, close all dropdowns
      setIsFontMenuOpen(false);
      setIsFontSizeMenuOpen(false);
      setIsTextColorMenuOpen(false);
      setIsFillColorMenuOpen(false);
      setIsHorizontalAlignMenuOpen(false);
      setIsVerticalAlignMenuOpen(false);
      setIsArrangeMenuOpen(false);
    };

    // Use a timeout to ensure button clicks happen first
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  // Sync toolbar state with selected elements
  useEffect(() => {
    if (selectedElements.length === 0) {
      // Reset to defaults when nothing is selected
      return;
    }

    // Get properties from first selected element
    const firstElement = selectedElements[0];
    if (!firstElement || !firstElement.businessObject) return;

    const bo = firstElement.businessObject;
    const di = bo.di;

    // Read font properties
    if (di?.FontName) {
      setSelectedFont(di.FontName);
    }
    if (di?.FontSize) {
      setSelectedFontSize(di.FontSize.toString());
    }
    if (di?.FontWeight) {
      setIsBold(di.FontWeight === 'bold');
    }
    if (di?.FontStyle) {
      setIsItalic(di.FontStyle === 'italic');
    }
    if (di?.TextDecoration) {
      setIsUnderline(di.TextDecoration === 'underline');
    }
    if (di?.FontColor) {
      setSelectedTextColor(di.FontColor);
    }

    // Read fill color from style
    if (firstElement.type && editorRef?.current) {
      // Try to get fill color from element style
      // This might need to be accessed differently depending on bpmn-js version
      const fill = firstElement.businessObject?.di?.fill;
      if (fill) {
        setSelectedFillColor(fill);
      }
    }
  }, [selectedElements, editorRef]);

  return (
    <div 
      data-format-toolbar
      className={cn(
        'h-12 bg-card border-b border-border flex items-center px-4 gap-2 shrink-0 relative z-50',
      className
      )}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Group 1: Font & Size */}
      <div className="flex items-center gap-2">
      {/* Font Dropdown */}
      <div className="relative format-toolbar-dropdown">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsFontMenuOpen(!isFontMenuOpen);
            }}
            disabled={!hasSelection}
            className={cn(
              "flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-accent transition-colors border border-input",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Font Family"
            aria-label="Select font family"
            type="button"
          >
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-foreground">{selectedFont}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {isFontMenuOpen && (
          <div data-dropdown-menu className="absolute top-full left-0 mt-1 p-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[120px]">
          {fonts.map((font) => (
            <button
              key={font}
                onClick={() => {
                  setSelectedFont(font);
                  setIsFontMenuOpen(false);
                  if (editorRef?.current) {
                    editorRef.current.applyFormatting({ font });
                  }
                }}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors"
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </div>
        )}
      </div>

      {/* Font Size Dropdown */}
      <div className="relative format-toolbar-dropdown">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsFontSizeMenuOpen(!isFontSizeMenuOpen);
            }}
            disabled={!hasSelection}
            className={cn(
              "flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-accent transition-colors border border-input",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Font Size"
            aria-label="Select font size"
            type="button"
          >
          <span className="text-xs text-foreground">{selectedFontSize}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {isFontSizeMenuOpen && (
          <div data-dropdown-menu className="absolute top-full left-0 mt-1 p-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[60px]">
          {fontSizes.map((size) => (
            <button
              key={size}
                onClick={() => {
                  setSelectedFontSize(size);
                  setIsFontSizeMenuOpen(false);
                  if (editorRef?.current) {
                    editorRef.current.applyFormatting({ fontSize: size });
                  }
                }}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors"
            >
              {size}
            </button>
          ))}
          </div>
        )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border mx-1" />

      {/* Group 2: Text Formatting */}
      <div className="flex items-center gap-1">
        {/* Font Size Increase/Decrease (AA) - Grouped visually */}
        <div className="flex items-center gap-0.5 border border-input rounded-md p-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!hasSelection) return;
              const currentSize = parseInt(selectedFontSize);
              const newSize = Math.max(8, currentSize - 1);
              const newSizeStr = newSize.toString();
              setSelectedFontSize(newSizeStr);
              if (editorRef?.current) {
                editorRef.current.applyFormatting({ fontSize: newSizeStr });
              }
            }}
            disabled={!hasSelection}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Decrease font size"
            aria-label="Decrease font size"
            type="button"
          >
            <div className="relative flex items-center justify-center">
              <span className="text-sm font-semibold leading-none" style={{ color: '#333333' }}>A</span>
              <span className="absolute -top-0.5 right-0 text-[8px] leading-none" style={{ color: '#3b82f6' }}>ˇ</span>
            </div>
          </button>
        <button
            onClick={(e) => {
              e.stopPropagation();
              if (!hasSelection) return;
              const currentSize = parseInt(selectedFontSize);
              const newSize = Math.min(24, currentSize + 1);
              const newSizeStr = newSize.toString();
              setSelectedFontSize(newSizeStr);
              if (editorRef?.current) {
                editorRef.current.applyFormatting({ fontSize: newSizeStr });
              }
            }}
            disabled={!hasSelection}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Increase font size"
            aria-label="Increase font size"
            type="button"
          >
            <div className="relative flex items-center justify-center">
              <span className="text-base font-semibold leading-none" style={{ color: '#333333' }}>A</span>
              <span className="absolute -top-0.5 right-0 text-[8px] leading-none" style={{ color: '#3b82f6' }}>^</span>
            </div>
        </button>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!hasSelection) return;
            const newBold = !isBold;
            setIsBold(newBold);
            if (editorRef?.current) {
              editorRef.current.applyFormatting({ bold: newBold });
            }
          }}
          disabled={!hasSelection}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors',
            isBold ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            !hasSelection && 'opacity-50 cursor-not-allowed'
          )}
          title="Bold (Ctrl+B)"
          aria-label="Bold text formatting"
          type="button"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!hasSelection) return;
            const newItalic = !isItalic;
            setIsItalic(newItalic);
            if (editorRef?.current) {
              editorRef.current.applyFormatting({ italic: newItalic });
            }
          }}
          disabled={!hasSelection}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors',
            isItalic ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            !hasSelection && 'opacity-50 cursor-not-allowed'
          )}
          title="Italic (Ctrl+I)"
          aria-label="Italic text formatting"
          type="button"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!hasSelection) return;
            const newUnderline = !isUnderline;
            setIsUnderline(newUnderline);
            if (editorRef?.current) {
              editorRef.current.applyFormatting({ underline: newUnderline });
            }
          }}
          disabled={!hasSelection}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors',
            isUnderline ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            !hasSelection && 'opacity-50 cursor-not-allowed'
          )}
          title="Underline (Ctrl+U)"
          aria-label="Underline text formatting"
          type="button"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        
        {/* Text Color */}
        <div className="relative format-toolbar-dropdown">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsTextColorMenuOpen(!isTextColorMenuOpen);
            }}
            disabled={!hasSelection}
            className={cn(
              "h-8 px-1.5 rounded-md hover:bg-accent transition-colors flex items-center gap-0.5 text-muted-foreground hover:text-foreground",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Text Color"
            aria-label="Select text color"
            type="button"
          >
            <div className="flex flex-col items-center gap-[2px]">
              <span 
                className="text-base font-semibold leading-none"
                style={{ color: '#333333' }}
              >
                A
              </span>
              <div 
                className="w-3 h-1 rounded-sm"
                style={{ backgroundColor: selectedTextColor }}
              />
            </div>
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
          {isTextColorMenuOpen && (
            <div data-dropdown-menu className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-md shadow-lg z-50 w-[240px]">
              {/* Cores do Tema */}
              <div className="text-xs text-muted-foreground mb-2">Cores do Tema</div>
              <div className="grid grid-cols-8 gap-1 mb-3">
                {themeColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1">
                    {col.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          updateRecentColors(color);
                          setSelectedTextColor(color);
                          setIsTextColorMenuOpen(false);
                          if (editorRef?.current) {
                            editorRef.current.applyFormatting({ textColor: color });
                          }
                        }}
                        className={cn(
                          "w-7 h-5 rounded-sm border hover:scale-105 transition-transform",
                          selectedTextColor === color ? "border-primary ring-2 ring-primary/20" : "border-border"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Cores Padrão */}
              <div className="text-xs text-muted-foreground mb-1">Cores Padrão</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {standardColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      updateRecentColors(color);
                      setSelectedTextColor(color);
                      setIsTextColorMenuOpen(false);
                      if (editorRef?.current) {
                        editorRef.current.applyFormatting({ textColor: color });
                      }
                    }}
                    className={cn(
                      "w-6 h-6 rounded border hover:scale-105 transition-transform",
                      selectedTextColor === color ? "border-primary ring-2 ring-primary/20" : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>

              {/* Cores Recentes */}
              <div className="text-xs text-muted-foreground mb-1">Cores Recentes</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(recentColors.length ? recentColors : Array(10).fill('#e5e7eb')).map((color, idx) => (
                  <button
                    key={`${color}-${idx}`}
                    onClick={() => {
                      updateRecentColors(color);
                      setSelectedTextColor(color);
                      setIsTextColorMenuOpen(false);
                      if (editorRef?.current) {
                        editorRef.current.applyFormatting({ textColor: color });
                      }
                    }}
                    className="w-6 h-6 rounded border border-border hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Select recent color ${color}`}
                  />
                ))}
              </div>

              {/* Mais cores */}
              <div className="border-t border-border pt-2 mt-2">
                <button
                  onClick={() => textColorInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors"
                  type="button"
                >
                  <Palette className="h-3.5 w-3.5" />
                  Mais cores...
                </button>
                <input
                  ref={textColorInputRef}
                  type="color"
                  className="hidden"
                  onChange={(e) => {
                    const color = e.target.value;
                    updateRecentColors(color);
                    setSelectedTextColor(color);
                    setIsTextColorMenuOpen(false);
                    if (editorRef?.current) {
                      editorRef.current.applyFormatting({ textColor: color });
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Fill Color (Paint Bucket) */}
        <div className="relative format-toolbar-dropdown">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsFillColorMenuOpen(!isFillColorMenuOpen);
            }}
            disabled={!hasSelection}
            className={cn(
              "h-8 px-1.5 rounded-md hover:bg-accent transition-colors flex items-center gap-0.5 text-muted-foreground hover:text-foreground",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Fill Color"
            aria-label="Select fill color"
            type="button"
          >
            {/* Custom Paint Bucket Icon with fill preview */}
            <div className="flex flex-col items-center gap-[2px]">
              <div className="relative">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Paint bucket handle - curved handle (tilted) */}
                  <g style={{ transform: 'rotate(25deg)', transformOrigin: '10px 10px' }}>
                    <path
                      d="M6 5C6 4 7 3 8 3H12C13 3 14 4 14 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Paint bucket body - trapezoid shape (tilted) */}
                    <path
                      d="M5 5H15L14 13C14 13.5 13.5 14 13 14H7C6.5 14 6 13.5 6 13L5 5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    {/* Spout - pouring spout (tilted) */}
                    <path
                      d="M14 5L15.5 7.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  {/* Paint stream pouring out (vertical - not rotated) */}
                  <path
                    d="M15.5 7.5L15.5 11L15.5 13"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Paint drops (vertical) */}
                  <circle cx="15.5" cy="11" r="0.8" fill="#3b82f6" />
                  <circle cx="15.5" cy="13.5" r="1" fill="#3b82f6" />
                  {/* Paint puddle at bottom */}
                  <ellipse cx="15.5" cy="15.5" rx="2" ry="1.2" fill="#3b82f6" />
                </svg>
              </div>
              {/* Fill preview bar (shows selected color) */}
              <div 
                className="w-3 h-1 rounded-sm"
                style={{ backgroundColor: selectedFillColor }}
              />
            </div>
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
          {isFillColorMenuOpen && (
            <div data-dropdown-menu className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-md shadow-lg z-50 w-[240px]">
              {/* Cores do Tema */}
              <div className="text-xs text-muted-foreground mb-2">Cores do Tema</div>
              <div className="grid grid-cols-8 gap-1 mb-3">
                {themeColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1">
                    {col.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          updateRecentColors(color);
                          setSelectedFillColor(color);
                          setIsFillColorMenuOpen(false);
                          if (editorRef?.current) {
                            editorRef.current.applyFormatting({ fillColor: color });
                          }
                        }}
                        className={cn(
                          "w-7 h-5 rounded-sm border hover:scale-105 transition-transform",
                          selectedFillColor === color ? "border-primary ring-2 ring-primary/20" : "border-border"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Select fill color ${color}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Cores Padrão */}
              <div className="text-xs text-muted-foreground mb-1">Cores Padrão</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {standardColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      updateRecentColors(color);
                      setSelectedFillColor(color);
                      setIsFillColorMenuOpen(false);
                      if (editorRef?.current) {
                        editorRef.current.applyFormatting({ fillColor: color });
                      }
                    }}
                    className={cn(
                      "w-6 h-6 rounded border hover:scale-105 transition-transform",
                      selectedFillColor === color ? "border-primary ring-2 ring-primary/20" : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Select fill color ${color}`}
                  />
                ))}
              </div>

              {/* Cores Recentes */}
              <div className="text-xs text-muted-foreground mb-1">Cores Recentes</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(recentColors.length ? recentColors : Array(10).fill('#e5e7eb')).map((color, idx) => (
                  <button
                    key={`${color}-${idx}`}
                    onClick={() => {
                      updateRecentColors(color);
                      setSelectedFillColor(color);
                      setIsFillColorMenuOpen(false);
                      if (editorRef?.current) {
                        editorRef.current.applyFormatting({ fillColor: color });
                      }
                    }}
                    className="w-6 h-6 rounded border border-border hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Select recent fill color ${color}`}
                  />
                ))}
              </div>

              {/* Mais cores */}
              <div className="border-t border-border pt-2 mt-2">
                <button
                  onClick={() => fillColorInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors"
                  type="button"
                >
                  <Palette className="h-3.5 w-3.5" />
                  Mais cores...
                </button>
                <input
                  ref={fillColorInputRef}
                  type="color"
                  className="hidden"
                  onChange={(e) => {
                    const color = e.target.value;
                    updateRecentColors(color);
                    setSelectedFillColor(color);
                    setIsFillColorMenuOpen(false);
                    if (editorRef?.current) {
                      editorRef.current.applyFormatting({ fillColor: color });
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Horizontal Alignment Dropdown */}
        <div className="relative format-toolbar-dropdown">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsHorizontalAlignMenuOpen(!isHorizontalAlignMenuOpen);
            }}
            disabled={!hasSelection}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground gap-0.5",
              (isHorizontalAlignMenuOpen || textAlign !== 'left') && "bg-accent text-foreground",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Text Alignment"
            aria-label="Select text alignment"
            type="button"
          >
            {textAlign === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
            {textAlign === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
            {textAlign === 'right' && <AlignRight className="h-3.5 w-3.5" />}
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
          {isHorizontalAlignMenuOpen && (
            <div data-dropdown-menu className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-md shadow-lg z-50 min-w-[220px]">
              <div className="flex flex-col text-sm">
                <button 
                  onClick={() => {
                    setTextAlign('left');
                    setIsHorizontalAlignMenuOpen(false);
                    editorRef?.current?.applyFormatting({ textAlign: 'left' });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                    textAlign === 'left' && "bg-accent"
                  )}
                  title="Align Left"
                >
                  <AlignLeft className="h-4 w-4 text-blue-600" />
                  <span>Alinhar à Esquerda</span>
                </button>
                <button 
                  onClick={() => {
                    setTextAlign('center');
                    setIsHorizontalAlignMenuOpen(false);
                    editorRef?.current?.applyFormatting({ textAlign: 'center' });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                    textAlign === 'center' && "bg-accent"
                  )}
                  title="Align Center"
                >
                  <AlignCenter className="h-4 w-4 text-blue-600" />
                  <span>Alinhar Centralizado</span>
                </button>
                <button 
                  onClick={() => {
                    setTextAlign('right');
                    setIsHorizontalAlignMenuOpen(false);
                    editorRef?.current?.applyFormatting({ textAlign: 'right' });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                    textAlign === 'right' && "bg-accent"
                  )}
                  title="Align Right"
                >
                  <AlignRight className="h-4 w-4 text-blue-600" />
                  <span>Alinhar à Direita</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {false && (
        <div className="relative format-toolbar-dropdown">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsVerticalAlignMenuOpen(!isVerticalAlignMenuOpen);
            }}
            disabled={!hasSelection}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground gap-0.5",
              isVerticalAlignMenuOpen && "bg-accent text-foreground",
              !hasSelection && "opacity-50 cursor-not-allowed"
            )}
            title="Vertical Alignment"
            aria-label="Select vertical alignment"
            type="button"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Square outline */}
              <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1"/>
              {/* Vertical double arrow (up and down) */}
              <path d="M8 4 L6 6 M8 4 L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M8 12 L6 10 M8 12 L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Horizontal lines on sides */}
              <line x1="0.5" y1="5" x2="2" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0.5" y1="8" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0.5" y1="11" x2="2" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="14" y1="5" x2="15.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="14" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="14" y1="11" x2="15.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
          </button>
          {isVerticalAlignMenuOpen && (
            <div data-dropdown-menu className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-md shadow-lg z-50 min-w-[220px]">
              <div className="flex flex-col text-sm">
                <button 
                  onClick={() => {
                    setVerticalAlign('top');
                    setIsVerticalAlignMenuOpen(false);
                    editorRef?.current?.applyFormatting({ verticalAlign: 'top' });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                    verticalAlign === 'top' && "bg-accent"
                  )}
                  title="Alinhar na parte superior"
                >
                  <svg
                    className="h-4 w-4 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="2.5" y="2.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="5" y="4.25" width="10" height="2.5" rx="0.5" fill="currentColor" />
                    <rect x="5" y="9" width="10" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="1" />
                    <rect x="5" y="12.5" width="10" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  <span>Superior</span>
                </button>
                <button 
                  onClick={() => {
                    setVerticalAlign('middle');
                    setIsVerticalAlignMenuOpen(false);
                    editorRef?.current?.applyFormatting({ verticalAlign: 'middle' });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                    verticalAlign === 'middle' && "bg-accent"
                  )}
                  title="Alinhar ao meio"
                >
                  <svg
                    className="h-4 w-4 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="2.5" y="2.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="5" y="4.5" width="10" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="1" />
                    <rect x="5" y="9" width="10" height="2.5" rx="0.5" fill="currentColor" />
                    <rect x="5" y="13" width="10" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  <span>Ao Meio</span>
                </button>
                <button 
                  onClick={() => {
                    setVerticalAlign('bottom');
                    setIsVerticalAlignMenuOpen(false);
                    editorRef?.current?.applyFormatting({ verticalAlign: 'bottom' });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                    verticalAlign === 'bottom' && "bg-accent"
                  )}
                  title="Alinhar na parte inferior"
                >
                  <svg
                    className="h-4 w-4 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="2.5" y="2.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="5" y="4.5" width="10" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="1" />
                    <rect x="5" y="8.5" width="10" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="1" />
                    <rect x="5" y="12.75" width="10" height="2.5" rx="0.5" fill="currentColor" />
                  </svg>
                  <span>Inferior</span>
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border mx-1" />

      {/* Group 3: Arrange (disabled) */}
      {false && (
        {/* Arrange removed */}
      )}

      {/* Simulation (placed before action buttons) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // TODO: wire simulation action
        }}
        className="flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
        title="Run Simulation"
        aria-label="Run process simulation"
        type="button"
      >
        <Play className="h-3.5 w-3.5" />
        <span>Simulation</span>
      </button>

      {/* Group 4: Action Buttons (Wizard, Search, History) */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWizardClick?.();
          }}
          className="flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
          title="Process Wizard"
          aria-label="Open process wizard"
          type="button"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Wizard</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSearchClick?.();
          }}
          className="flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
          title="Search (Ctrl+F)"
          aria-label="Search elements"
          type="button"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHistoryClick?.();
          }}
          className="flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
          title="Version History"
          aria-label="View version history"
          type="button"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>History</span>
        </button>
      </div>
    </div>
  );
}

