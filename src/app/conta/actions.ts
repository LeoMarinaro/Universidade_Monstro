"use server";

import { del, put } from "@vercel/blob";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { leaveRunningSeason, purgeDeletedUsers } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ProfileState = { error: string | null; saved: boolean };

const NAME_MAX = 40;

// Name and phone (the phone will identify people to the WhatsApp bot)
export async function updateProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const phoneInput = String(formData.get("phone") ?? "").trim();
  // Digits only, e.g. "(11) 99999-0000" -> "11999990000"
  const phone = phoneInput.replace(/\D/g, "") || null;

  if (name.length < 1 || name.length > NAME_MAX) {
    return { error: `O nome precisa ter entre 1 e ${NAME_MAX} caracteres.`, saved: false };
  }
  if (phone && (phone.length < 10 || phone.length > 13)) {
    return { error: "Celular inválido. Use DDD + número, ex.: (11) 99999-0000.", saved: false };
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { name, phone } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Esse celular já está em outra conta.", saved: false };
    }
    throw error;
  }
  return { error: null, saved: true };
}

export type AvatarState = { error: string | null };

// The browser already shrinks the photo to a small JPEG (avatar-uploader.tsx);
// this is the server-side guard
const AVATAR_MAX_BYTES = 500_000;

// Saves the new profile photo in Vercel Blob and removes the old one
export async function uploadAvatar(_previous: AvatarState, formData: FormData): Promise<AvatarState> {
  const user = await getCurrentUser();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.type !== "image/jpeg" || file.size === 0 || file.size > AVATAR_MAX_BYTES) {
    return { error: "Não deu para usar essa imagem. Tente outra foto." };
  }

  const blob = await put(`avatars/${user.id}.jpg`, file, {
    access: "public",
    contentType: "image/jpeg",
    // A new name per upload, so browsers don't keep showing the old photo
    addRandomSuffix: true,
  });
  await prisma.user.update({ where: { id: user.id }, data: { image: blob.url } });
  if (user.image) await deleteAvatarFile(user.image);

  refresh();
  return { error: null };
}

export async function removeAvatar() {
  const user = await getCurrentUser();
  await prisma.user.update({ where: { id: user.id }, data: { image: null } });
  if (user.image) await deleteAvatarFile(user.image);
  refresh();
}

// The old photo going missing in Blob must not break the profile update
async function deleteAvatarFile(url: string) {
  try {
    await del(url);
  } catch (error) {
    console.error("Couldn't delete old avatar", error);
  }
}

export type DeleteAccountState = { error: string | null };

// "Conta deletada": personal data is wiped right away and the person leaves
// every group (their points in running seasons freeze, like leaving a group).
// The row stays while a running season needs it, then it's removed for good.
export async function deleteAccount(
  _previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await getCurrentUser();
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "APAGAR") {
    return { error: 'Digite APAGAR para confirmar.' };
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: {
      groupId: true,
      role: true,
      group: { select: { name: true, members: { select: { userId: true, role: true } } } },
    },
  });

  // Same rule as leaving a group: the only admin passes the role on first
  const blocked = memberships.filter(
    ({ role, group }) =>
      role === "ADMIN" &&
      group.members.some((m) => m.userId !== user.id) &&
      !group.members.some((m) => m.userId !== user.id && m.role === "ADMIN"),
  );
  if (blocked.length > 0) {
    return {
      error: `Você é o único admin de: ${blocked.map((m) => m.group.name).join(", ")}. Torne outra pessoa admin antes de apagar a conta.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const { groupId, group } of memberships) {
      if (group.members.length === 1) {
        // Last member: the group goes away, as when leaving it
        await tx.group.delete({ where: { id: groupId } });
      } else {
        await leaveRunningSeason(tx, groupId, user.id);
      }
    }
    await tx.membership.deleteMany({ where: { userId: user.id } });

    // Personal data out; the diary and pending requests are personal too
    await tx.workout.deleteMany({ where: { userId: user.id } });
    await tx.workoutRequest.deleteMany({ where: { userId: user.id, status: "PENDING" } });
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: "Conta deletada",
        email: `deleted-${user.id}@deleted.invalid`,
        emailVerified: false,
        image: null,
        phone: null,
        deletedAt: new Date(),
      },
    });
    // No more logging in: password and every session go
    await tx.account.deleteMany({ where: { userId: user.id } });
    await tx.session.deleteMany({ where: { userId: user.id } });
  });

  if (user.image) await deleteAvatarFile(user.image);
  await purgeDeletedUsers();
  redirect("/entrar");
}
