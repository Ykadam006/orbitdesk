import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchFilter, defaultFilters } from "@/components/board/SearchFilter";

describe("SearchFilter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders search and filter controls", () => {
    const onChange = jest.fn();
    render(<SearchFilter filters={defaultFilters} onChange={onChange} members={[]} />);
    expect(screen.getByLabelText("Search cards")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by assignee")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by due date")).toBeInTheDocument();
  });

  it("debounces search query changes", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();
    render(<SearchFilter filters={defaultFilters} onChange={onChange} members={[]} />);

    await user.type(screen.getByLabelText("Search cards"), "bug");

    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ query: "bug" }));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, query: "bug" });
  });

  it("updates priority filter immediately", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();
    render(<SearchFilter filters={defaultFilters} onChange={onChange} members={[]} />);

    await user.selectOptions(screen.getByLabelText("Filter by priority"), "HIGH");
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, priority: "HIGH" });
  });

  it("shows clear button when filters are active", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();
    render(
      <SearchFilter
        filters={{ ...defaultFilters, priority: "HIGH" }}
        onChange={onChange}
        members={[]}
      />
    );

    expect(screen.getByRole("button", { name: /Clear/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Clear/ }));
    expect(onChange).toHaveBeenCalledWith(defaultFilters);
  });
});
