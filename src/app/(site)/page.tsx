import { Hero } from "@/components/home/Hero";
import { InfoBar, WaysToOrder } from "@/components/home/InfoBar";
import { StorySection } from "@/components/home/StorySection";
import { SignatureDishes } from "@/components/home/SignatureDishes";
import { FoodGallery } from "@/components/home/FoodGallery";
import { FindUs, ClosingCta } from "@/components/home/FindUs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <InfoBar />
      <WaysToOrder />
      <StorySection />
      <SignatureDishes />
      <FoodGallery />
      <FindUs />
      <ClosingCta />
    </>
  );
}
