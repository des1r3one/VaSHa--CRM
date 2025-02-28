import * as React from "react"

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

const PopoverContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

const Popover: React.FC<PopoverProps> & {
  Trigger: React.FC<PopoverTriggerProps>;
  Content: React.FC<PopoverContentProps>;
} = ({ children, className = "" }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div className={`relative ${className}`}>{children}</div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  children,
  asChild = false,
  className = "",
}) => {
  const { setIsOpen } = React.useContext(PopoverContext);

  const handleClick = () => {
    setIsOpen((prev) => !prev);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      className: `${(children as React.ReactElement).props.className || ""} ${className}`,
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className = "",
}) => {
  const { isOpen } = React.useContext(PopoverContext);

  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-50 mt-2 rounded-md border border-gray-200 bg-white p-4 shadow-md ${className}`}
    >
      {children}
    </div>
  );
};

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;

export { Popover };
