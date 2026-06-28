import { TextEncoder, TextDecoder } from "util";

if (typeof globalThis.TextEncoder === "undefined") {
  Object.assign(globalThis, { TextEncoder, TextDecoder });
}

if (typeof globalThis.Headers === "undefined") {
  class MockHeaders {
    private _map = new Map<string, string>();
    constructor(init?: HeadersInit | MockHeaders) {
      if (init && typeof init === "object" && !Array.isArray(init)) {
        if (init instanceof MockHeaders) {
          init._map.forEach((v, k) => this._map.set(k, v));
        } else {
          for (const [k, v] of Object.entries(init)) {
            this._map.set(k.toLowerCase(), String(v));
          }
        }
      }
    }
    get(name: string) { return this._map.get(name.toLowerCase()) ?? null; }
    set(name: string, value: string) { this._map.set(name.toLowerCase(), value); }
    has(name: string) { return this._map.has(name.toLowerCase()); }
    delete(name: string) { this._map.delete(name.toLowerCase()); }
    forEach(cb: (value: string, key: string) => void) { this._map.forEach(cb); }
    entries() { return this._map.entries(); }
    [Symbol.iterator]() { return this._map.entries(); }
  }
  (globalThis as Record<string, unknown>).Headers = MockHeaders;
}

if (typeof globalThis.Response === "undefined") {
  // Store body text on a symbol so NextResponse subclass can find it
  const BODY_TEXT = Symbol.for("__mockBodyText");

  class MockResponse {
    body: unknown;
    [BODY_TEXT]: string;
    status: number;
    statusText: string;
    headers: InstanceType<typeof globalThis.Headers>;
    ok: boolean;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      // When NextResponse.json calls new NextResponse(response.body, response),
      // response.body is null but init is the previous MockResponse with BODY_TEXT
      if (typeof body === "string") {
        this[BODY_TEXT] = body;
      } else if (init && (init as unknown as Record<symbol, string>)[BODY_TEXT]) {
        this[BODY_TEXT] = (init as unknown as Record<symbol, string>)[BODY_TEXT];
      } else {
        this[BODY_TEXT] = "";
      }
      this.body = null;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || "";
      this.headers = new globalThis.Headers(init?.headers as Record<string, string>);
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      const text = this[BODY_TEXT];
      if (text) return JSON.parse(text);
      return {};
    }
    async text() { return this[BODY_TEXT]; }
    clone() { return new MockResponse(this[BODY_TEXT], { status: this.status, headers: this.headers as unknown as HeadersInit }); }

    static json(data: unknown, init?: ResponseInit) {
      const body = JSON.stringify(data);
      const headers = new globalThis.Headers(init?.headers as Record<string, string>);
      headers.set("content-type", "application/json");
      return new MockResponse(body, { ...init, headers: headers as unknown as HeadersInit });
    }
  }
  (globalThis as Record<string, unknown>).Response = MockResponse;
}

if (typeof globalThis.Request === "undefined") {
  class MockRequest {
    private _url: URL;
    method: string;
    headers: InstanceType<typeof globalThis.Headers>;
    private _body: string | null;

    constructor(input: string | URL, init?: RequestInit) {
      this._url = typeof input === "string" ? new URL(input) : input;
      this.method = init?.method || "GET";
      this.headers = new globalThis.Headers(init?.headers as Record<string, string>);
      this._body = (init?.body as string) || null;
    }

    get url() { return this._url.toString(); }
    async json() { return JSON.parse(this._body || "{}"); }
    async text() { return this._body || ""; }
  }
  (globalThis as Record<string, unknown>).Request = MockRequest;
}
