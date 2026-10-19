import { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";
import DashboardClient from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const [designs, templates] = await Promise.all([
    db.design.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        category: true,
        width: true,
        height: true,
        thumbnailUrl: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
    db.template.findMany({
      select: { id: true, title: true, category: true, width: true, height: true, isPro: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <DashboardClient
      user={{ name: user.name ?? user.email.split("@")[0], email: user.email }}
      designs={designs.map((d) => ({
        ...d,
        thumbnailUrl: d.thumbnailUrl ?? null,
        updatedAt: d.updatedAt.toISOString(),
      }))}
      templates={templates}
    />
  );
}
