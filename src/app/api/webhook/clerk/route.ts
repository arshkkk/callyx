import type { WebhookEvent } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prismaClient } from "@/lib/prisma";
import { Webhook } from "svix";
import { Prisma } from "@prisma/client";
import defaultAvaibility from "@/data/defaultAvaibility";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  console.log(JSON.stringify(payload, null, 2));

  try {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error(
        "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
      );
    }

    // Get the headers
    const headerPayload = req.headers;
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    const wh = new Webhook(WEBHOOK_SECRET);

    const body = JSON.stringify(payload);
    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occured", {
        status: 400,
      });
    }

    console.log(
      `Webhook with and ID of ${evt.data.id} and type of ${evt.type}`,
    );

    switch (evt.type) {
      case "user.deleted":
        {
          const id = evt.data.id;
          console.log({ id });

          const [user] = await Promise.all([
            prismaClient.user.delete({
              where: { id },
            }),
            prismaClient.availability.delete({
              where: { userId: id },
            }),
          ]);

          console.log("user deleted with id: ", id);
          return Response.json({ success: true, user }, { status: 202 });
        }
        break;

      case "user.created":
        {
          // UserJSON.first_name is a string
          const firstName = evt.data.first_name as string;
          const id = evt.data.id;
          // UserJSON.last_name is a string
          const lastName = evt.data.last_name as string;
          // UserJSON.email_addresses is an array of EmailAddressJSON
          const email = evt.data.email_addresses.at(0)?.email_address || "";
          console.log({ id });
          const user = await prismaClient.user.create({
            data: {
              email,
              firstName,
              id,
              lastName,
              availability: {
                create: defaultAvaibility,
              },
            },
          });
          console.log("user created with email: ", email);
          return Response.json({ success: true, user }, { status: 201 });
        }
        break;

      case "user.updated": {
        // UserJSON.first_name is a string
        const firstName = evt.data.first_name as string;
        const id = evt.data.id;
        // UserJSON.last_name is a string
        const lastName = evt.data.last_name as string;
        // UserJSON.email_addresses is an array of EmailAddressJSON
        const email = evt.data.email_addresses.at(0)?.email_address || "";

        const user = await prismaClient.user.update({
          where: { id },
          data: { email, firstName: firstName, id, lastName },
        });
        console.log("user updated with email: ", email);
        return Response.json({ success: true, user }, { status: 201 });
      }
    }

    return Response.json({ success: false, message: "no action " + evt?.type });
  } catch (e) {
    console.log("Action failed, ", e);
    return Response.json(
      // @ts-ignore
      { success: false, message: e?.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ success: true, message: "hello from arshdeep!" });
}
