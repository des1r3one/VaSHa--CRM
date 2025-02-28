import * as React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "",
  name,
  size = "md",
  className = "",
}) => {
  const initials = React.useMemo(() => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, [name]);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <div
        className={`relative rounded-full overflow-hidden ${sizeClass} ${className}`}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gray-500 text-white ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
};

export { Avatar }; 