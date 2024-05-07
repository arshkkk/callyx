import { auth } from "@clerk/nextjs/server";
import { prismaClient } from "@/lib/prisma";
import { NextRequest } from "next/server";
import availabilitySchema from "@/zod-validations/availabilitySchema";

export const PUT = async (req: NextRequest) => {
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { success, data, error } =
      await availabilitySchema.safeParseAsync(body);

    if (!success) {
      return Response.json(
        { success: false, message: "not valid payload/body", error },
        { status: 400 },
      );
    }

    const availability = await prismaClient.availability.update({
      where: { userId },
      data,
    });

    return Response.json(
      { success: true, message: "updated successfully", data: availability },
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
