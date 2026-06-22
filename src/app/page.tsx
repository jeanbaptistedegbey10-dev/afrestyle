// src/app/page.tsx
import { getProducts } from "@/lib/shopify/products";
import HeroSection from "@/components/home/HeroSection";
import ProductsSection from "@/components/home/ProductsSection";
import DesignersSection from "@/components/home/DesignersSection";
import StorySection from "@/components/home/StorySection";
import NewsletterSection from "@/components/home/NewsletterSection";

export default async function HomePage() {
  const { products } = await getProducts({ first: 4 });

  return (
    <>
      <HeroSection />
      <ProductsSection products={products} />
      <DesignersSection />
      <StorySection />
      <NewsletterSection />
    </>
  );
}
