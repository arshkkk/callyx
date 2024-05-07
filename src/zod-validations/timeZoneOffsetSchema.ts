import { z } from "zod";

const timeZoneOffsetSchema = z
  .number()
  .min(-12 * 60)
  .max(14 * 60);

export default timeZoneOffsetSchema;
