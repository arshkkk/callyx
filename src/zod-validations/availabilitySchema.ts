import { z } from "zod";

const minuteInDay = z.number().min(0).max(1440);
const period = z.object({ start: minuteInDay, end: minuteInDay });
const availabilitySchema = z.object({
  timeZone: z.string(),
  workingHours: z.array(
    z.object({
      day: z.number(),
      availability: z.array(period),
    }),
  ),
  dateOverrides: z
    .array(
      z.object({
        date: z
          .string()
          .datetime()
          .transform((dateString) => new Date(dateString)),
        availability: z.array(period),
      }),
    )
    // filter out overrides without any actual start and end times
    .transform((dateOverrides) =>
      dateOverrides.filter((data) => data.availability.length > 0),
    ),
});

export default availabilitySchema;
