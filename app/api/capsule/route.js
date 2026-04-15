import { prisma } from "@/lib/prisma.config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return Response.json(
          { error: "Session expirée, reconnecte-toi." },
          { status: 401 },
        );
      }
      return Response.json({ error: "Token invalide." }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, date, visibility, password, files } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
      });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const capsule = await prisma.capsule.create({
      data: {
        name,
        description: description || null,
        openDate: date ? new Date(date) : null,
        visibility,

        password: visibility === "private" ? hashedPassword : null,
        files: files?.length ? files : null,
        userId: decoded.id,
      },
    });

    return new Response(JSON.stringify({ capsule }), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return Response.json(
          { error: "Session expirée, reconnecte-toi." },
          { status: 401 },
        );
      }
      return Response.json({ error: "Token invalide." }, { status: 401 });
    }

    const capsules = await prisma.capsule.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        openDate: true,
        createdAt: true,
        files: true,
      },
    });

    return new Response(JSON.stringify({ capsules }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
