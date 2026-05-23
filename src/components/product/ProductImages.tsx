// src/components/product/ProductImages.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";

export default function ProductImages({
  images,
  title,
}: {
  images: ShopifyImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="flex gap-4">
      {/* Thumbnails verticales */}
      {images.length > 1 && (
        <div className="flex flex-col gap-3 w-20">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActiveIndex(i)}
              className="relative aspect-square overflow-hidden rounded-sm transition-all"
              style={{
                border: `1px solid ${i === activeIndex ? "#D4AF37" : "rgba(212,175,55,0.15)"}`,
              }}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image principale */}
      <div
        className="relative flex-1 aspect-[3/4] overflow-hidden rounded-sm"
        style={{ background: "#1E293B" }}
      >
        <Image
          src={images[activeIndex].url}
          alt={images[activeIndex].altText ?? title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
