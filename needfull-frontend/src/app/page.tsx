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
      <main className="relative">
        {/* Abstract glowing blurs */}
        <div className="pointer-events-none fixed -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-gold/5 blur-3xl" />
        <div className="pointer-events-none fixed -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-brand/5 blur-3xl" />
        {/* Subtle top-left accent */}
        <div className="pointer-events-none fixed left-1/4 top-1/3 h-64 w-64 rounded-full bg-brand-light/30 blur-3xl" />

        <HeroSection />
        <HowItWorksSection />
        <EarnSection />
        <TestimonialsSection />
        <PosterSection />
        <FaqSection />
        <CtaSection />
      </main>
      <FooterSection />
    </>
  );
}
