import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function convertToTimezone(date: string, fromTz: string) {
  return dayjs.tz(date, fromTz).toDate();
}

export function isValidTimeZone(value: string) {
  try {
    dayjs().tz(value);
    return true;
  } catch (error) {
    return false;
  }
}

export default dayjs;
