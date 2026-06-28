"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(
    null
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  function handleClose(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => handleClose(false)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          >
            <h2 id="confirm-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {state.title}
            </h2>
            <p id="confirm-message" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {state.message}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => handleClose(false)}>
                {state.cancelLabel || "Cancel"}
              </Button>
              <Button
                variant={state.variant === "danger" ? "danger" : "primary"}
                onClick={() => handleClose(true)}
              >
                {state.confirmLabel || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
