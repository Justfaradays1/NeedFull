import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { EarnSection } from '@/components/landing/EarnSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PosterSection } from '@/components/landing/PosterSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { FooterSection } from '@/components/landing/FooterSection';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <EarnSection />
      <TestimonialsSection />
      <PosterSection />
      <FaqSection />
      <CtaSection />
      <FooterSection />
    </>
  );
}
