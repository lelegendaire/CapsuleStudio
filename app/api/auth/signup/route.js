import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req) {
  const body = await req.json()
  const { email, password, name } = body

  // Vérifier si utilisateur existe
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 })
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  })

  return new Response(JSON.stringify({ user }), { status: 201 })
}