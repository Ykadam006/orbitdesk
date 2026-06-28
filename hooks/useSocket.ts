"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useBoardStore, Card } from "@/store/boardStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

export function useSocket(boardId: string, userId: string, userName: string) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addCard, updateCard, moveCard, removeCard } = useBoardStore();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;

    async function setup() {
      try {
        const res = await fetch("/api/auth/socket-token");
        if (!res.ok || cancelled) return;
        const { token } = await res.json();
        if (cancelled) return;

        socket = io(SOCKET_URL, {
          transports: ["websocket"],
          reconnection: false,
          auth: { token },
        });
        socketRef.current = socket;

        function scheduleReconnect() {
          if (cancelled || reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) return;

          const delay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
            MAX_RECONNECT_DELAY
          );
          reconnectAttemptRef.current += 1;

          reconnectTimerRef.current = setTimeout(() => {
            if (!cancelled && socket && !socket.connected) {
              socket.connect();
            }
          }, delay);
        }

        socket.on("connect", () => {
          reconnectAttemptRef.current = 0;
          socket?.emit("board:join", { boardId });
        });

        socket.on("disconnect", scheduleReconnect);
        socket.on("connect_error", scheduleReconnect);

        socket.on("card:created", ({ card }: { card: Card }) => addCard(card));
        socket.on("card:updated", ({ card }: { card: Card }) => updateCard(card.id, card));
        socket.on("card:moved", ({ card }: { card: Card }) =>
          moveCard(card.id, card.status, card.position)
        );
        socket.on("card:deleted", ({ cardId }: { cardId: string }) => removeCard(cardId));
        socket.on("presence:updated", ({ users }: { users: OnlineUser[] }) =>
          setOnlineUsers(users)
        );
      } catch {
        // Token fetch failed — socket stays disconnected
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socket) {
        socket.emit("board:leave", { boardId, userId });
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [boardId, userId, userName, addCard, updateCard, moveCard, removeCard]);

  const emitCardCreated = useCallback(
    (card: Card) => socketRef.current?.emit("card:created", { boardId, card }),
    [boardId]
  );

  const emitCardUpdated = useCallback(
    (card: Card) => socketRef.current?.emit("card:updated", { boardId, card }),
    [boardId]
  );

  const emitCardMoved = useCallback(
    (card: Card) => socketRef.current?.emit("card:moved", { boardId, card }),
    [boardId]
  );

  const emitCardDeleted = useCallback(
    (cardId: string) => socketRef.current?.emit("card:deleted", { boardId, cardId }),
    [boardId]
  );

  const emitActivity = useCallback(
    (activity: unknown) => socketRef.current?.emit("activity:created", { boardId, activity }),
    [boardId]
  );

  return {
    socket: socketRef,
    onlineUsers,
    emitCardCreated,
    emitCardUpdated,
    emitCardMoved,
    emitCardDeleted,
    emitActivity,
  };
}
