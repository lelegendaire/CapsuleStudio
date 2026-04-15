import { prisma } from "@/lib/prisma.config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { password } = body;

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
        visibility: true,
      },
    });

    if (!capsule) {
      return new Response(JSON.stringify({ error: "Capsule not found" }), {
        status: 404,
      });
    }

    // Only check password for private capsules
    if (capsule.visibility !== "private" || !capsule.password) {
      return new Response(JSON.stringify({ unlocked: true }), { status: 200 });
    }

    const isValid = await bcrypt.compare(password, capsule.password);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
      });
    }

    return new Response(JSON.stringify({ unlocked: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
