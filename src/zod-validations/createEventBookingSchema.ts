import { z } from "zod";

const createEventBookingSchema = z.object({
  start: z.string().datetime(),
  attendees: z
    .array(z.object({ name: z.string(), email: z.string().email() }))
    .min(1, { message: "There should be atleast one attendee" }),
  context: z.string().max(200).optional(),
  eventTypeSlug: z.string(),
  userId: z.string(),
});

export default createEventBookingSchema;
