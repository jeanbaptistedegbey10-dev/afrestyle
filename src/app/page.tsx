// src/app/page.tsx
import { getProducts } from "@/lib/shopify/products";
import HeroSection from "@/components/home/HeroSection";
import Reassurance from "@/components/home/Reassurance";
import CategoriesGrid from "@/components/home/CategoriesGrid";
import ProductsSection from "@/components/home/ProductsSection";
import StorySection from "@/components/home/StorySection";
import LookbookPreview from "@/components/home/LookbookPreview";
import NewsletterSection from "@/components/home/NewsletterSection";
import { getProductVisuals } from "@/components/home/ProductVisualsProvider";

export default async function HomePage() {
  const { products } = await getProducts({ first: 4 });

  // Visuels produits :
  // - Si nous avons des produits Shopify, on utilise les visuels du catalogue
  //   (getAllProductsCatalog) pour alimenter la rotation produits.
  // - Sinon, ProductsSection utilise IMAGES.products (visuels éditoriaux).
  const productVisuals = await getProductVisuals({ catalogSize: products.length || 12 });

  return (
    <>
      <HeroSection />
      <Reassurance />
      <CategoriesGrid />
      <ProductsSection
        products={products}
        productVisuals={productVisuals}
      />
      <StorySection />
      <LookbookPreview />
      <NewsletterSection />
    </>
  );
}


