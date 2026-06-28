export class PrismaClient {}

export const Role = { OWNER: "OWNER", ADMIN: "ADMIN", MEMBER: "MEMBER" } as const;
export const CardStatus = { TODO: "TODO", IN_PROGRESS: "IN_PROGRESS", REVIEW: "REVIEW", DONE: "DONE" } as const;
export const Priority = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" } as const;

export type Role = (typeof Role)[keyof typeof Role];
export type CardStatus = (typeof CardStatus)[keyof typeof CardStatus];
export type Priority = (typeof Priority)[keyof typeof Priority];
