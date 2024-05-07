import { z } from "zod";

const timeZoneOffsetSchema = z.preprocess(
  (v) => Number(v),
  z
    .number()
    .min(-12 * 60)
    .max(14 * 60),
);

export default timeZoneOffsetSchema;
