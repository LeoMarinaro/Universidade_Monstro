"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type CreateGroupState = { error: string | null };

const NAME_MIN = 2;
const NAME_MAX = 40;

// Creates the group with the creator as its first member and admin
export async function createGroup(
  _previous: CreateGroupState,
  formData: FormData,
): Promise<CreateGroupState> {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { error: `O nome precisa ter entre ${NAME_MIN} e ${NAME_MAX} caracteres.` };
  }

  const group = await prisma.group.create({
    data: {
      name,
      createdById: user.id,
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
    select: { id: true },
  });

  redirect(`/grupos/${group.id}`);
}

// Invite link: joins the group as a competitor. Joining doesn't add the person
// to the running season (nobody enters mid-season); they compete from the next one.
export async function joinGroup(inviteCode: string) {
  const user = await getCurrentUser();
  const group = await prisma.group.findUnique({ where: { inviteCode }, select: { id: true } });
  if (!group) redirect("/");

  // upsert: opening the link twice (or as a member already) changes nothing
  await prisma.membership.upsert({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
    create: { userId: user.id, groupId: group.id, role: "COMPETITOR" },
    update: {},
  });

  redirect(`/grupos/${group.id}`);
}
