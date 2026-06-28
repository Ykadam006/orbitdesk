import { Orbit } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Orbit className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">OrbitDesk</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Built with Next.js, TypeScript, PostgreSQL, and Socket.IO
          </p>
        </div>
      </div>
    </footer>
  );
}
