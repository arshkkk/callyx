import { NextRequest } from "next/server";
import { prismaClient } from "@/lib/prisma";
import { z } from "zod";
import availabilitySchema from "@/zod-validations/availabilitySchema";
import timeZoneOffsetSchema from "@/zod-validations/timeZoneOffsetSchema";

const querySchema = z.object({
  date: z.string().date(),
  timezoneOffsetInMinutes: timeZoneOffsetSchema,
});

const generateTimeSlots = (
  workingHours: Array<{ start: number; end: number }>,
  duration: number,
) => {
  const slots: Array<{ start: number; end: number }> = [];

  workingHours.forEach(({ start, end }) => {
    for (let i = start; i + duration <= end; i += duration) {
      slots.push({ start: i, end: i + duration });
    }
  });

  return slots;
};

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
    const day = new Date(query.date).getUTCDay();

    const workingHoursForWeek = // @ts-ignore
      (availability as z.infer<typeof availabilitySchema>).workingHours;
    const workingHoursForDay = workingHoursForWeek[day].availability;

    return Response.json({
      data: generateTimeSlots(workingHoursForDay, durationInMinutes),
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
// 3. get availability for that particular day using getUTCDay()
// 4. convert add offset ( -ve/+ve ) to the availability ( it will strip out availability of user that lies after or before the day it is requested for )
// 5. go over each availability and generate slots of duration of eventType
