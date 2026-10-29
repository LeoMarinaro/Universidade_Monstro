import Image from "next/image";

// Profile photo, or the first letter of the name when there's none.
// Size and border come from the caller's className (e.g. "size-8").
export function Avatar({
  name,
  image,
  className = "size-8 text-[13px]",
}: {
  name: string;
  image: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-line-soft font-semibold ${className}`}
    >
      {image ? (
        <Image src={image} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
