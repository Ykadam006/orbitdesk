export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }
      const message =
        (data as { error?: string } | undefined)?.error ||
        `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status, data);
    }

    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return undefined as T;
    }

    return (await res.json()) as T;
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0
    );
  }
}
