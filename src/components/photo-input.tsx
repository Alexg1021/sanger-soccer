"use client";

import { resizeImage } from "@/lib/resize-image";

/** File input that shrinks big phone photos in the browser before they're uploaded. */
export function PhotoInput({ id = "photo", name = "photo" }: { id?: string; name?: string }) {
  return (
    <input
      id={id}
      name={name}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="text-sm"
      onChange={async (ev) => {
        const input = ev.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
        const small = await resizeImage(file);
        if (small !== file) {
          const dt = new DataTransfer();
          dt.items.add(small);
          input.files = dt.files;
        }
      }}
    />
  );
}
