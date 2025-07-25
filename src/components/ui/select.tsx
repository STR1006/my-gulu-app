import React, { useState, useRef, useEffect } from 'react';

// Make SelectProps generic to accept a specific value type
interface SelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  children: React.ReactNode;
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// Make SelectItemProps generic to ensure value matches the Select's type
interface SelectItemProps<T extends string> extends React.HTMLAttributes<HTMLDivElement> {
  value: T;
  children: React.ReactNode;
}

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

// Update SelectContext to allow triggerRef to be null
const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>; // Allow null
} | undefined>(undefined);

// Update Select component to be generic
const Select = <T extends string>({ value, onValueChange, children }: SelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null); // useRef can be null initially

  // FIX: Changed 'onOpenChange' back to 'onValueChange' to match the context interface
  const contextValue = React.useMemo(() => ({
    value,
    onValueChange: onValueChange as (value: string) => void, // Cast to string for context
    isOpen,
    setIsOpen,
    triggerRef,
  }), [value, onValueChange, isOpen, triggerRef]);

  return (
    <SelectContext.Provider value={contextValue}>
      {children}
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      console.error("SelectTrigger must be used within a Select component.");
      return <button className={className} {...props}>{children}</button>;
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (children && (children as React.ReactElement<any>).props.onClick) {
        (children as React.ReactElement<any>).props.onClick(e);
      }
      context.setIsOpen(!context.isOpen);
    };

    const combinedRef = (node: HTMLButtonElement) => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node; // Allow null
        }
      }
      context.triggerRef.current = node;
    };

    return (
      <button
        ref={combinedRef}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className || ''}`}
        onClick={handleClick}
        {...props}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 opacity-50"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, ...props }) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    console.error("SelectValue must be used within a Select component.");
    return <span {...props}>{placeholder}</span>;
  }
  return <span {...props}>{context.value || placeholder}</span>;
};
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      console.error("SelectContent must be used within a Select component.");
      return null;
    }

    if (!context.isOpen) return null;

    const { triggerRef } = context;
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8, // 8px offset
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, [context.isOpen, triggerRef]);

    return (
      <div
        ref={ref}
        className={`absolute z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className || ''}`}
        style={{ top: position.top, left: position.left, minWidth: position.width }}
        {...props}
      >
        <div className="p-1">
          {children}
        </div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

// Update SelectItem to be generic
const SelectItem = React.forwardRef(<T extends string>(
  { className, value, children, ...props }: SelectItemProps<T>,
  ref: React.Ref<HTMLDivElement>
) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    console.error("SelectItem must be used within a Select component.");
    return <div className={className} {...props}>{children}</div>;
  }

  const handleClick = () => {
    context.onValueChange(value); // This will now correctly handle the generic type
    context.setIsOpen(false);
  };

  return (
    <div
      ref={ref}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className || ''}`}
      onClick={handleClick}
      role="option"
      aria-selected={context.value === value}
      {...props}
    >
      {context.value === value && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      )}
      {children}
    </div>
  );
}) as <T extends string>(props: SelectItemProps<T> & { ref?: React.Ref<HTMLDivElement> }) => React.ReactElement; // Cast for generic forwardRef

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
