import { prisma } from "@/lib/prisma.config"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password } = body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    return new Response(JSON.stringify({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    }), { status: 200 })
    
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 })
  }
}