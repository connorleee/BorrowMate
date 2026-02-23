import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(255),
  description: z.string().max(1000).optional().default(""),
  category: z.string().max(100).optional().default(""),
  privacy: z.enum(["private", "public"]).default("private"),
  groupId: z.string().uuid().nullable().optional(),
});

export const deleteItemSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
});

export const updateItemSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  price_usd: z.number().min(0).optional(),
});
