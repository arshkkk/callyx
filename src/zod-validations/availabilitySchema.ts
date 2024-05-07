import { z } from "zod";
import timeZoneOffsetSchema from "@/zod-validations/timeZoneOffsetSchema";

const minuteInDay = z.number().min(0).max(1440);
const period = z.object({ start: minuteInDay, end: minuteInDay });
const availabilitySchema = z.object({
  timeZone: z.string(),
  timeZoneOffset: timeZoneOffsetSchema,
  workingHours: z.array(
    z.object({
      day: z.number(),
      availability: z.array(period),
    }),
  ),
  dateOverrides: z.array(
    z.object({
      date: z
        .string()
        .datetime()
        .transform((dateString) => new Date(dateString)),
      availability: z.array(period),
    }),
  ),
});

export default availabilitySchema;
