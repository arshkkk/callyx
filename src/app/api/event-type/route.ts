import { NextRequest } from "next/server";
import eventTypeSchema from "@/zod-validations/eventTypeSchema";
import { prismaClient } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const {
      data: body,
      success,
      error,
    } = await eventTypeSchema.safeParseAsync(await req.json());

    if (!success || !body) {
      return Response.json(
        {
          message: "Not valid Event Type Payload/date",
          error,
          success: false,
        },
        { status: 400 },
      );
    }

    const event = await prismaClient.eventType.create({
      data: { ...body, user: { connect: { id: userId } } },
    });

    return Response.json(
      { data: event, success: true, message: "Event Created" },
      { status: 201 },
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
