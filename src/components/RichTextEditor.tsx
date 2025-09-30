import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
  style,
  minHeight = '120px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#000000', '#374151', '#6b7280', '#9ca3af',
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
  ];

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const applyColor = useCallback((color: string) => {
    execCommand('foreColor', color);
  }, [execCommand]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div className="border border-input rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2">
            <div className="grid grid-cols-4 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => applyColor(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "w-full px-3 py-2 text-sm text-foreground bg-background focus:outline-none",
          className
        )}
        style={{ 
          minHeight,
          ...style 
        }}
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;