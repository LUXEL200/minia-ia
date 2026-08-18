import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofSection from "@/components/SocialProofSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import PodcastSection from "@/components/PodcastSection";
import ParallelSection from "@/components/ParallelSection";
import FounderSection from "@/components/FounderSection";
import FeaturesSection from "@/components/FeaturesSection";
import ProcessSection from "@/components/ProcessSection";
import StylesSection from "@/components/StylesSection";
import ComparisonSection from "@/components/ComparisonSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import GalleryPreviewSection from "@/components/GalleryPreviewSection";
import VideoTestimonialsSection from "@/components/VideoTestimonialsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <ProblemSection />
        <SolutionSection />
        <PodcastSection />
        <ParallelSection />
        <FounderSection />
        <FeaturesSection />
        <ProcessSection />
        <StylesSection />
        <ComparisonSection />
        <TestimonialsSection />
        <GalleryPreviewSection />
        <VideoTestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
