import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No boards yet"
        description="Create your first board to get started."
      />
    );
    expect(screen.getByRole("heading", { name: "No boards yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first board to get started.")).toBeInTheDocument();
  });

  it("renders optional action", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Empty"
        description="Nothing here"
        action={<Button>Create Board</Button>}
      />
    );
    expect(screen.getByRole("button", { name: "Create Board" })).toBeInTheDocument();
  });
});
