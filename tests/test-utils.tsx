import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export const mockCard = {
  id: "card-1",
  title: "Fix login bug",
  description: "Users cannot sign in",
  status: "TODO" as const,
  priority: "HIGH" as const,
  dueDate: "2025-12-01T00:00:00.000Z",
  position: 0,
  boardId: "board-1",
  assignedToId: "user-1",
  assignedTo: { id: "user-1", name: "Alex", image: null },
  labels: [{ id: "l1", name: "Bug", color: "#ef4444" }],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
