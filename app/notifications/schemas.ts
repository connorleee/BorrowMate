import { z } from "zod";

export const markNotificationAsReadSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID"),
});

export const dismissNotificationSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID"),
});

// markAllNotificationsAsRead and dismissAllNotifications take no input --
// they only need authActionClient wrapping with no schema.
