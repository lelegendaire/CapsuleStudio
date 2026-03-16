import { prisma } from "@/lib/prisma.config"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    })

    return new Response(JSON.stringify({ user }), { status: 201 })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 })
  }
}