'use client';

/**
 * Format Toolbar Component
 * 
 * Toolbar with formatting options for BPMN elements:
 * - Color, Font, Font Size
 * - Text formatting (bold, italic, underline, etc.)
 * - Alignment options
 * - Arrange, Simulation, Search, History
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid3x3,
  Play,
  Plus,
  ChevronDown,
  Type,
  Palette,
  PaintBucket,
  Search,
  Clock,
} from 'lucide-react';

interface FormatToolbarProps {
  className?: string;
}

export function FormatToolbar({ className }: FormatToolbarProps) {
  const [selectedColor, setSelectedColor] = useState('#e4e4e7'); // light gray
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState('11');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const colors = [
    '#e4e4e7', // light gray
    '#f87171', // red
    '#fb923c', // orange
    '#fbbf24', // yellow
    '#84cc16', // green
    '#22d3ee', // cyan
    '#3b82f6', // blue
    '#a78bfa', // purple
    '#f472b6', // pink
  ];

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana'];
  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24'];

  return (
    <div className={cn(
      'h-12 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0',
      className
    )}>
      {/* Color Dropdown */}
      <div className="relative group">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors border border-input">
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-xs text-foreground">Color</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Font Dropdown */}
      <div className="relative group">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors border border-input">
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-foreground">{selectedFont}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="absolute top-full left-0 mt-1 p-1 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
          {fonts.map((font) => (
            <button
              key={font}
              onClick={() => setSelectedFont(font)}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors"
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size Dropdown */}
      <div className="relative group">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors border border-input">
          <span className="text-xs text-foreground">{selectedFontSize}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="absolute top-full left-0 mt-1 p-1 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[60px]">
          {fontSizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedFontSize(size)}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        {/* Font Size Increase/Decrease (AA) */}
        <div className="flex items-center gap-0.5">
          <button
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
            title="Decrease font size"
          >
            <span className="text-[10px] font-medium">A</span>
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
            title="Increase font size"
          >
            <span className="text-xs font-medium">A</span>
          </button>
        </div>
        
        <button
          onClick={() => setIsBold(!isBold)}
          className={cn(
            'p-1.5 rounded-md hover:bg-accent transition-colors',
            isBold ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        
        <button
          onClick={() => setIsItalic(!isItalic)}
          className={cn(
            'p-1.5 rounded-md hover:bg-accent transition-colors',
            isItalic ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        
        <button
          onClick={() => setIsUnderline(!isUnderline)}
          className={cn(
            'p-1.5 rounded-md hover:bg-accent transition-colors',
            isUnderline ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        
        {/* Text Color */}
        <div className="relative group">
          <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center">
            <span className="text-xs font-medium underline">A</span>
            <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
          </button>
          <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="grid grid-cols-3 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {}}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Fill Color (Paint Bucket) */}
        <div className="relative group">
          <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <PaintBucket className="h-3.5 w-3.5" />
            <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
          </button>
          <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="grid grid-cols-3 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {}}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Horizontal Alignment Dropdown */}
        <div className="relative group">
          <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center">
            <AlignLeft className="h-3.5 w-3.5" />
            <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
          </button>
          <div className="absolute top-full left-0 mt-1 p-1 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="flex flex-col gap-1">
              <button className="p-1.5 rounded hover:bg-accent transition-colors">
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded hover:bg-accent transition-colors">
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded hover:bg-accent transition-colors">
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Vertical Alignment Dropdown */}
        <div className="relative group">
          <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center">
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
          <div className="absolute top-full left-0 mt-1 p-1 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
            <div className="flex flex-col gap-1">
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1"/>
                  <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="5" x2="2" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="8" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="11" x2="2" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="5" x2="15.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="11" x2="15.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Superior</span>
              </button>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1"/>
                  <line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="2" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="5" x2="2" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="8" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="11" x2="2" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="5" x2="15.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="11" x2="15.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Ao Meio</span>
              </button>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1"/>
                  <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="5" x2="2" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="8" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="0.5" y1="11" x2="2" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="5" x2="15.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="11" x2="15.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Inferior</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Plus button */}
        <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Action Buttons */}
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
        title="Arrange"
      >
        <Grid3x3 className="h-3.5 w-3.5" />
        <span>Arrange</span>
      </button>
      
      {/* Right-aligned action buttons group */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
          title="Simulation"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Simulation</span>
        </button>
        
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
          title="Search"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
        </button>
        
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
          title="History"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>History</span>
        </button>
      </div>
    </div>
  );
}

