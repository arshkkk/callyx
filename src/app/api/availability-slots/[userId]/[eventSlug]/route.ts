import { NextRequest } from "next/server";
import { prismaClient } from "@/lib/prisma";
import { z } from "zod";
import availabilitySchema from "@/zod-validations/availabilitySchema";
import timeZoneOffsetSchema from "@/zod-validations/timeZoneOffsetSchema";
import dayjs, { convertToTimezone, isValidTimeZone } from "@/lib/dayjs";

const querySchema = z.object({
  date: z.string().date(),
  timezoneOffsetInMinutes: timeZoneOffsetSchema,
  timezone: z.string().refine(isValidTimeZone, { message: "Invalid timezone" }),
});

// generate slots in iso formats
const generateTimeSlots = (
  date: Date,
  workingHours: Array<{ start: number; end: number }>,
  duration: number,
) => {
  const dateJ = dayjs(date);

  const slots: Array<string> = [];

  workingHours.forEach(({ start, end }) => {
    for (let i = start; i + duration <= end; i += duration) {
      slots.push(dateJ.add(i, "minutes").toISOString());
    }
  });

  return slots;
};

// TODO: handle multi timezones
export const GET = async (
  req: NextRequest,
  {
    params: { userId, eventSlug },
  }: { params: { userId: string; eventSlug: string } },
) => {
  try {
    const _query = new URLSearchParams(new URL(req.url).searchParams);

    const {
      success,
      data: query,
      error,
    } = await querySchema.safeParseAsync({
      date: _query.get("date"),
      timezoneOffsetInMinutes: _query.get("timezoneOffsetInMinutes"),
      timezone: _query.get("timezone"),
    });

    if (!success || !query) {
      return Response.json(
        { success: false, error, message: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const [event, availability] = await Promise.all([
      prismaClient.eventType.findFirst({
        where: { userId: userId, slug: eventSlug },
      }),
      prismaClient.availability.findFirst({
        where: { userId },
      }),
    ]);

    if (!event || !availability) {
      return Response.json({ success: false }, { status: 404 });
    }

    const durationInMinutes = event.durationInMinutes;
    const userTimeZoneDateObj = convertToTimezone(
      query.date,
      // without this server's timezone can make issues
      query.timezone,
    );
    const day = userTimeZoneDateObj.getDay();

    const {
      workingHours: workingHoursForWeek,
      dateOverrides,
    } = // @ts-ignore
      availability as z.infer<typeof availabilitySchema>;
    const workingHoursForDay =
      // check if any date override exists or not otherwise go with working hours ( schedule)
      dateOverrides.find((d) => dayjs(d.date).isSame(query.date))
        ?.availability || workingHoursForWeek[day].availability;

    return Response.json({
      data: generateTimeSlots(
        userTimeZoneDateObj,
        workingHoursForDay,
        durationInMinutes,
      ),
    });
  } catch (e) {
    console.log(e);
    return Response.json(
      // @ts-ignore
      { message: "Something went wrong!", success: true },
      { status: 500 },
    );
  }
};

// availability calender

// 1. validate timezone offset and date
// 2. get event-type with eventId and user's availability with userId
// 3. create get availability for that particular day using getUTCDay()
// 4. convert add offset ( -ve/+ve ) to the availability ( it will strip out availability of user that lies after or before the day it is requested for )
// 5. go over each availability and generate slots of duration of eventType
