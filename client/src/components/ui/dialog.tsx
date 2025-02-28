import * as React from "react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const DialogContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

const Dialog: React.FC<DialogProps> & {
  Trigger: React.FC<DialogTriggerProps>;
  Content: React.FC<DialogContentProps>;
  Header: React.FC<DialogHeaderProps>;
  Footer: React.FC<DialogFooterProps>;
  Title: React.FC<DialogTitleProps>;
  Description: React.FC<DialogDescriptionProps>;
} = ({ open, onOpenChange, children, className = "" }) => {
  const [isOpenState, setIsOpenState] = React.useState(open || false);
  
  const isOpen = open !== undefined ? open : isOpenState;
  
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    }
    setIsOpenState(value);
  };

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpenState(open);
    }
  }, [open]);

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      <div className={className}>{children}</div>
    </DialogContext.Provider>
  );
};

const DialogTrigger: React.FC<DialogTriggerProps> = ({
  asChild = false,
  children,
  className = "",
}) => {
  const { setIsOpen } = React.useContext(DialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setIsOpen(true),
      className: `${children.props.className || ""} ${className}`,
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => setIsOpen(true)}
    >
      {children}
    </button>
  );
};

const DialogContent: React.FC<DialogContentProps> = ({
  children,
  className = "",
}) => {
  const { isOpen, setIsOpen } = React.useContext(DialogContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md mx-auto ${className}`}>
        <button
          type="button"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  className = "",
}) => (
  <div className={`p-6 pb-0 ${className}`}>{children}</div>
);

const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  className = "",
}) => (
  <div className={`p-6 pt-0 flex justify-end gap-2 ${className}`}>{children}</div>
);

const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  className = "",
}) => (
  <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
);

const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  className = "",
}) => (
  <p className={`mt-2 text-sm text-gray-500 ${className}`}>{children}</p>
);

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }; 