import {
  canManageMembers,
  canDeleteWorkspace,
  canManageBoard,
  canManageCards,
  canDeleteCard,
  canChangeRoles,
} from "@/lib/permissions";

describe("canManageMembers", () => {
  it("allows OWNER", () => {
    expect(canManageMembers("OWNER")).toBe(true);
  });

  it("allows ADMIN", () => {
    expect(canManageMembers("ADMIN")).toBe(true);
  });

  it("denies MEMBER", () => {
    expect(canManageMembers("MEMBER")).toBe(false);
  });
});

describe("canDeleteWorkspace", () => {
  it("allows OWNER only", () => {
    expect(canDeleteWorkspace("OWNER")).toBe(true);
    expect(canDeleteWorkspace("ADMIN")).toBe(false);
    expect(canDeleteWorkspace("MEMBER")).toBe(false);
  });
});

describe("canManageBoard", () => {
  it("allows OWNER and ADMIN", () => {
    expect(canManageBoard("OWNER")).toBe(true);
    expect(canManageBoard("ADMIN")).toBe(true);
    expect(canManageBoard("MEMBER")).toBe(false);
  });
});

describe("canManageCards", () => {
  it("allows all roles to manage cards", () => {
    expect(canManageCards("OWNER")).toBe(true);
    expect(canManageCards("ADMIN")).toBe(true);
    expect(canManageCards("MEMBER")).toBe(true);
  });
});

describe("canDeleteCard", () => {
  it("allows OWNER and ADMIN to delete any card", () => {
    expect(canDeleteCard("OWNER", "user1", { assignedToId: "user2" })).toBe(true);
    expect(canDeleteCard("ADMIN", "user1", { assignedToId: "user2" })).toBe(true);
  });

  it("allows MEMBER to delete only assigned cards", () => {
    expect(canDeleteCard("MEMBER", "user1", { assignedToId: "user1" })).toBe(true);
    expect(canDeleteCard("MEMBER", "user1", { assignedToId: "user2" })).toBe(false);
    expect(canDeleteCard("MEMBER", "user1", { assignedToId: null })).toBe(false);
  });
});

describe("canChangeRoles", () => {
  it("allows OWNER only", () => {
    expect(canChangeRoles("OWNER")).toBe(true);
    expect(canChangeRoles("ADMIN")).toBe(false);
    expect(canChangeRoles("MEMBER")).toBe(false);
  });
});
