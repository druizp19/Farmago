import * as React from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

type OptionType = string | { value: string; label: string };

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
  renderValue?: (selected: string[]) => string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  className,
  maxDisplay = 2,
  renderValue,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Normalize options to always have value and label
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => 
      typeof opt === 'string' 
        ? { value: opt, label: opt }
        : opt
    );
  }, [options]);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = React.useMemo(() => {
    if (renderValue) {
      return renderValue(selected);
    }
    
    if (selected.length === 0) return placeholder;
    
    const selectedLabels = selected.map(val => {
      const option = normalizedOptions.find(opt => opt.value === val);
      return option?.label || val;
    });
    
    if (selected.length <= maxDisplay) {
      return selectedLabels.join(', ');
    }
    return `${selectedLabels.slice(0, maxDisplay).join(', ')} +${selected.length - maxDisplay}`;
  }, [selected, placeholder, maxDisplay, normalizedOptions, renderValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-8 justify-between text-xs font-normal',
            selected.length > 0 && 'border-violet-300 bg-violet-50 text-violet-700',
            className
          )}
        >
          <span className="truncate flex-1 text-left">{displayText}</span>
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {selected.length > 0 && (
              <X
                className="h-3 w-3 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {normalizedOptions.length === 0 ? (
            <div className="p-4 text-xs text-gray-400 text-center">
              No hay opciones disponibles
            </div>
          ) : (
            <div className="p-1">
              {normalizedOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleToggle(option.value)}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer hover:bg-gray-100',
                    selected.includes(option.value) && 'bg-violet-50 text-violet-700'
                  )}
                >
                  <div className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border border-gray-300',
                    selected.includes(option.value) && 'bg-violet-600 border-violet-600'
                  )}>
                    {selected.includes(option.value) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="flex-1 truncate">{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
