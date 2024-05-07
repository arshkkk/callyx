import { NextRequest } from "next/server";
import createEventBookingSchema from "@/zod-validations/createEventBookingSchema";
import { prismaClient } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import dayjs from "@/lib/dayjs";

export const POST = async (
  req: NextRequest,
  { params }: { params: { userId: string; eventSlug: string } },
) => {
  try {
    const {
      data: body,
      success,
      error,
    } = await createEventBookingSchema.safeParseAsync(await req.json());

    if (!success || !body) {
      return Response.json(
        { success: false, error, message: "Invalid request body" },
        { status: 400 },
      );
    }

    const eventType = await prismaClient.eventType.findFirst({
      where: { slug: params.eventSlug, userId: params.userId },
      include: { user: true },
    });
    if (!eventType) {
      return Response.json(
        { success: false, error, message: "Event Type doesn't exists" },
        { status: 404 },
      );
    }

    const { start, context, attendees } = body;
    const payload: Prisma.EventBookingCreateInput = {
      start,
      end: dayjs(start)
        .add(eventType.durationInMinutes, "minutes")
        .toISOString(),
      context,
      attendees: { createMany: { data: attendees } },
      eventType: { connect: { id: eventType.id } },
      user: { connect: { id: eventType.user.id } },
    };
    const eventBooking = await prismaClient.eventBooking.create({
      data: payload,
    });

    return Response.json(
      {
        success: true,
        message: "booking created successfully",
        data: eventBooking,
      },
      { status: 200 },
    );
  } catch (e) {
    console.log(e);
    return Response.json(
      // @ts-ignore
      { message: "Something went wrong!", success: true },
      { status: 500 },
    );
  }
};
