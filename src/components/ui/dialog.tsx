import React, { useEffect } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

interface DialogTriggerProps {
  children: React.ReactElement; // DialogTrigger expects a single React element child
}

const DialogContext = React.createContext<{ onOpenChange: (open: boolean) => void } | undefined>(undefined);

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          {/* This is the overlay */}
        </div>
      )}
    </DialogContext.Provider>
  );
};

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children }) => {
  const context = React.useContext(DialogContext);
  if (!context) {
    console.error("DialogTrigger must be used within a Dialog component.");
    return children; // Render children as fallback
  }

  const handleClick = (e: React.MouseEvent) => {
    // Ensure children.props is safely accessed and has onClick
    if (children && typeof (children as React.ReactElement<any>).props.onClick === 'function') {
      (children as React.ReactElement<any>).props.onClick(e);
    }
    context.onOpenChange(true);
  };

  // Directly clone and add onClick.
  // We need to ensure the children prop is correctly typed to allow onClick.
  // This cast helps TypeScript understand that children is a ReactElement with props.
  return React.cloneElement(children as React.ReactElement<any>, {
    onClick: handleClick,
  });
};

const DialogContent: React.FC<DialogContentProps> = ({ className, children, ...props }) => {
  const context = React.useContext(DialogContext);
  if (!context) {
    console.error("DialogContent must be used within a Dialog component.");
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg ${className}`}
      {...props}
    >
      {children}
      <button
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        onClick={() => context.onOpenChange(false)}
      >
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
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
};

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
);

const DialogFooter: React.FC<DialogFooterProps> = ({ className, ...props }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
);

const DialogTitle: React.FC<DialogTitleProps> = ({ className, ...props }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
);

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props} />
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
