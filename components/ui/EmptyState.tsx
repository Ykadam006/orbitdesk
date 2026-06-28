import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Icon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md text-center mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}
