import { z } from "zod";

const eventTypeSchema = z.object({
  title: z.string().min(3).max(25),
  description: z.string().max(200).optional(),
  slug: z.string().max(25),
  durationInMinutes: z.number().min(10).max(600),
});

export default eventTypeSchema;
