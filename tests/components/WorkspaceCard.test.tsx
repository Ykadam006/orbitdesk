import { render, screen } from "@testing-library/react";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";

describe("WorkspaceCard", () => {
  it("renders workspace details", () => {
    render(
      <WorkspaceCard
        id="ws-1"
        name="Engineering"
        boardCount={3}
        memberCount={5}
        role="ADMIN"
      />
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/workspace/ws-1");
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByText("3 boards")).toBeInTheDocument();
    expect(screen.getByText("5 members")).toBeInTheDocument();
  });

  it("uses singular labels for single board and member", () => {
    render(
      <WorkspaceCard
        id="ws-2"
        name="Solo"
        boardCount={1}
        memberCount={1}
        role="MEMBER"
      />
    );
    expect(screen.getByText("1 board")).toBeInTheDocument();
    expect(screen.getByText("1 member")).toBeInTheDocument();
  });
});
