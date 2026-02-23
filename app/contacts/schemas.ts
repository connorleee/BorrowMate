import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1, "Contact name is required").max(255),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
});

export const updateContactSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID"),
  name: z.string().min(1, "Contact name is required").max(255),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
});

export const deleteContactSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID"),
});

export const linkContactToUserSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID"),
  userId: z.string().uuid("Invalid user ID"),
});
