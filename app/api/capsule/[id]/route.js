import { prisma } from "@/lib/prisma.config";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const unlocked = url.searchParams.get("unlocked") === "true";

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!capsule) {
      return new Response(JSON.stringify({ error: "Capsule not found" }), {
        status: 404,
      });
    }

    const hasPassword = !!capsule.password && capsule.visibility === "private";

    // Don't expose files for password-protected capsules unless unlocked
    const { password, ...safeCapsule } = capsule;

    return new Response(
      JSON.stringify({
        capsule: {
          ...safeCapsule,
          files: hasPassword && !unlocked ? null : safeCapsule.files,
        },
        hasPassword,
        filesHidden: hasPassword && !unlocked,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
