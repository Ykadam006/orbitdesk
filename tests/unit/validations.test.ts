import { registerSchema, loginSchema, workspaceSchema, boardSchema, cardSchema } from "@/lib/validations";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "Yogesh Kadam",
      email: "yogesh@test.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({
      name: "Y",
      email: "yogesh@test.com",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Yogesh",
      email: "not-an-email",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "Yogesh",
      email: "yogesh@test.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without a number", () => {
    const result = registerSchema.safeParse({
      name: "Yogesh",
      email: "yogesh@test.com",
      password: "PasswordOnly",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "yogesh@test.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "yogesh@test.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("workspaceSchema", () => {
  it("accepts valid workspace name", () => {
    const result = workspaceSchema.safeParse({ name: "My Team" });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = workspaceSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 50 characters", () => {
    const result = workspaceSchema.safeParse({ name: "A".repeat(51) });
    expect(result.success).toBe(false);
  });
});

describe("boardSchema", () => {
  it("accepts valid board title", () => {
    const result = boardSchema.safeParse({ title: "Sprint Board" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = boardSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("cardSchema", () => {
  it("accepts valid card data", () => {
    const result = cardSchema.safeParse({
      title: "Fix login bug",
      description: "Users can't login with Google",
      status: "TODO",
      priority: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal card data", () => {
    const result = cardSchema.safeParse({ title: "Do something" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = cardSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = cardSchema.safeParse({ title: "Test", status: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = cardSchema.safeParse({ title: "Test", priority: "SUPER_HIGH" });
    expect(result.success).toBe(false);
  });
});
