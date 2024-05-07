import { auth } from "@clerk/nextjs/server";
import { prismaClient } from "@/lib/prisma";

export const GET = async () => {
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const user = await prismaClient.user.findFirst({
      where: { id: userId! },
      include: { availability: true },
    });

    return Response.json({
      data: user,
      success: true,
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
