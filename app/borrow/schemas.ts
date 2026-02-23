import { z } from "zod";

export const borrowItemSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  groupId: z.string().uuid("Invalid group ID"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().optional(),
  borrowerName: z.string().optional(),
});

export const returnItemSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  itemId: z.string().uuid("Invalid item ID"),
  groupId: z.string(), // Can be empty string -- used for revalidation only
});

export const batchLendToContactSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1, "Select at least one item"),
  contactId: z.string().uuid("Invalid contact ID"),
  dueDate: z.string().optional(),
});

export const createBorrowRequestSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  contactId: z.string().uuid("Invalid contact ID"),
  dueDate: z.string().optional(),
  message: z.string().max(500).optional(),
});

export const acceptBorrowRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
});

export const rejectBorrowRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  rejectionMessage: z.string().max(500).optional(),
});

export const getOrCreateContactForGroupMemberSchema = z.object({
  groupMemberId: z.string().uuid("Invalid group member ID"),
  memberName: z.string().optional(),
  memberEmail: z.string().email().optional(),
});
