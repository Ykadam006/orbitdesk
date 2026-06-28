"use client";

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface Props {
  onlineUsers: OnlineUser[];
}

export function PresenceBar({ onlineUsers }: Props) {
  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Online:</span>
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 5).map((user) => (
          <div
            key={user.userId}
            className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white dark:border-gray-900 flex items-center justify-center"
            title={user.userName}
          >
            <span className="text-xs font-medium text-white">
              {user.userName?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        ))}
        {onlineUsers.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              +{onlineUsers.length - 5}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
