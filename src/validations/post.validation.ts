import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.enum(["EVENT", "FOOD", "SPORTS", "DAYRO", "OTHER"]),
  subcategory: z.string().max(100).optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === "string" ? val.split(",").map((t) => t.trim()) : val))
    .optional(),
  eventDate: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  eventVenue: z.string().max(200).optional(),
  isOngoing: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .optional(),
  address: z.string().max(300).optional(),
  locationCoordinate: z.string().max(100).optional(),
  images: z.array(z.string().url("Each image must be a valid URL")).optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const postQuerySchema = z.object({
  category: z.enum(["EVENT", "FOOD", "SPORTS", "DAYRO", "OTHER"]).optional(),
  subcategory: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["latest", "popular", "upcoming"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
