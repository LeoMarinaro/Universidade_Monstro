"use client";

import { useActionState, useState, useTransition, type ChangeEvent } from "react";
import { Avatar } from "@/components/avatar";
import { removeAvatar, uploadAvatar, type AvatarState } from "./actions";

// Photos are cropped to a square and shrunk in the browser before upload:
// a 5 MB phone photo becomes ~60 KB, well under the server action size limit
const SIZE = 512;

async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas not available");
  // Center crop
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the photo"))), "image/jpeg", 0.85),
  );
}

const initialState: AvatarState = { error: null };

export function AvatarUploader({ name, image }: { name: string; image: string | null }) {
  const [state, uploadAction, uploading] = useActionState(uploadAvatar, initialState);
  const [removing, startRemove] = useTransition();
  const [, startUpload] = useTransition();
  const [readError, setReadError] = useState<string | null>(null);
  const busy = uploading || removing;

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // picking the same file again still triggers a change
    if (!file) return;
    setReadError(null);

    try {
      const photo = await toSquareJpeg(file);
      const form = new FormData();
      form.append("avatar", new File([photo], "avatar.jpg", { type: "image/jpeg" }));
      startUpload(() => uploadAction(form));
    } catch {
      setReadError("Não deu para abrir essa imagem. Tente outra foto.");
    }
  }

  const error = readError ?? state.error;

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} image={image} className="size-20 border-2 border-accent font-display text-3xl font-bold" />
      <div className="flex flex-col items-start gap-1.5">
        <label
          className={`flex h-11 cursor-pointer items-center rounded-xl border border-accent px-4 text-sm font-semibold text-accent hover:bg-raised ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {uploading ? "Enviando…" : image ? "Trocar foto" : "Adicionar foto"}
          <input type="file" accept="image/*" onChange={handleChange} disabled={busy} className="sr-only" />
        </label>
        {image && (
          <button
            type="button"
            disabled={busy}
            onClick={() => startRemove(() => removeAvatar())}
            className="min-h-9 px-1 text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
          >
            {removing ? "Removendo…" : "Remover foto"}
          </button>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
