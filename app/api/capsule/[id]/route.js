import { prisma } from "@/lib/prisma.config";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!capsule) {
      return new Response(JSON.stringify({ error: "Capsule not found" }), {
        status: 404,
      });
    }

    // Ne pas exposer le mot de passe
    const { password, ...safeCapule } = capsule;

    return new Response(
      JSON.stringify({ capsule: safeCapule, hasPassword: !!password }),
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
