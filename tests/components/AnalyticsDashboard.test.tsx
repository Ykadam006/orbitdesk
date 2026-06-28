import { render, screen, waitFor } from "@testing-library/react";
import { AnalyticsDashboard } from "@/components/workspace/AnalyticsDashboard";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

const mockAnalytics = {
  totalCards: 42,
  completedThisWeek: 8,
  byStatus: [
    { name: "Todo", value: 10 },
    { name: "Done", value: 5 },
  ],
  byPriority: [
    { name: "High", value: 3 },
    { name: "Low", value: 2 },
  ],
  byMember: [{ name: "Alex", count: 4 }],
};

describe("AnalyticsDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    (apiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<AnalyticsDashboard workspaceId="ws-1" />);
    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
  });

  it("renders analytics data on success", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(mockAnalytics);
    render(<AnalyticsDashboard workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Total Cards")).toBeInTheDocument();
    expect(screen.getByText("Completed This Week")).toBeInTheDocument();
    expect(screen.getByText("Cards by Status")).toBeInTheDocument();
    expect(screen.getByText("Cards by Priority")).toBeInTheDocument();
    expect(screen.getByText("Member Workload")).toBeInTheDocument();
  });

  it("shows error state on failure", async () => {
    (apiFetch as jest.Mock).mockRejectedValue(new Error("Failed"));
    render(<AnalyticsDashboard workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load analytics.")).toBeInTheDocument();
    });
  });

  it("shows empty chart messages when no data", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      totalCards: 0,
      completedThisWeek: 0,
      byStatus: [{ name: "Todo", value: 0 }],
      byPriority: [{ name: "Low", value: 0 }],
      byMember: [],
    });
    render(<AnalyticsDashboard workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByText("No cards by status yet")).toBeInTheDocument();
    });
    expect(screen.getByText("No cards by priority yet")).toBeInTheDocument();
    expect(screen.getByText("No member workload data yet")).toBeInTheDocument();
  });
});
