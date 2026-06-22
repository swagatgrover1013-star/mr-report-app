import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  return NextResponse.json({ users: safeUsers });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.employeeId || !body?.password) {
    return NextResponse.json({ error: "Name, email, employee ID, and password are required." }, { status: 400 });
  }
  if (typeof body.password !== "string" || body.password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const avatarColors = ["var(--indigo)", "var(--brass)", "#7C9885", "#B5495B", "#8C6D3F"];

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      employeeId: body.employeeId,
      role: body.role ?? "mr",
      territory: body.territory ?? "",
      phone: body.phone ?? "",
      avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      status: "active",
      joinedAt: new Date().toISOString().split("T")[0],
      passwordHash,
    },
  });

  const { passwordHash: _omit, ...safeUser } = user;
  return NextResponse.json({ user: safeUser }, { status: 201 });
}
