import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";
import EditorShell from "@/components/editor/editor-shell";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ designId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { designId } = await params;
  const design = await db.design.findUnique({
    where: { id: designId },
    select: { title: true },
  });
  return { title: design?.title ?? "Editor" };
}

export default async function EditorPage({ params }: Props) {
  const user = await requireUser();
  const { designId } = await params;

  const design = await db.design.findFirst({
    where: { id: designId, userId: user.id },
  });
  if (!design) notFound();

  return (
    <EditorShell
      design={{
        id: design.id,
        title: design.title,
        category: design.category,
        width: design.width,
        height: design.height,
        jsonPayload: design.jsonPayload,
        meta: design.meta,
      }}
    />
  );
}
