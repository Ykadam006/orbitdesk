import { render, screen } from "@testing-library/react";
import { PresenceBar } from "@/components/board/PresenceBar";

describe("PresenceBar", () => {
  it("returns null when no users online", () => {
    const { container } = render(<PresenceBar onlineUsers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders online user avatars", () => {
    render(
      <PresenceBar
        onlineUsers={[
          { userId: "u1", userName: "Alex", socketId: "s1" },
          { userId: "u2", userName: "Jordan", socketId: "s2" },
        ]}
      />
    );
    expect(screen.getByText("Online:")).toBeInTheDocument();
    expect(screen.getByTitle("Alex")).toBeInTheDocument();
    expect(screen.getByTitle("Jordan")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("shows overflow count when more than 5 users", () => {
    const users = Array.from({ length: 7 }, (_, i) => ({
      userId: `u${i}`,
      userName: `User${i}`,
      socketId: `s${i}`,
    }));
    render(<PresenceBar onlineUsers={users} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
