import Image from "next/image";
import { OvenMark } from "@/components/site/OvenMark";

/**
 * A dish photo filling its (relatively positioned) box, or a quiet clay-oven
 * tile when the dish has no photo. Use it wherever a layout needs a picture.
 */
export function DishImage({
  src,
  alt,
  sizes,
  className = "object-cover",
  markClassName = "h-1/2 w-1/2",
}: {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  markClassName?: string;
}) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-cream-200 text-earth/25">
        <OvenMark ground={false} className={markClassName} />
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />;
}
