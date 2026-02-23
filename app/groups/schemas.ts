import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(255),
  description: z.string().max(1000).optional().default(""),
});

export const joinGroupByInviteCodeSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export const regenerateInviteCodeSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
});

export const addItemsToGroupSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  itemIds: z.array(z.string().uuid()).min(1, "Select at least one item"),
});

export const addMembersSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  userIds: z.array(z.string().uuid()).min(1, "Select at least one user"),
});
