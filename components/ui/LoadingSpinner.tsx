import { Loader2 } from "lucide-react";

interface Props {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ message = "Loading...", size = "md" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className={`${sizes[size]} text-indigo-600 animate-spin mb-3`} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
