import { Navbar } from '@/components/landing/Navbar';
import { AnnouncementStrip } from '@/components/landing/AnnouncementStrip';
import { HeroSection } from '@/components/landing/HeroSection';
import { DiscoverySearchSection } from '@/components/landing/DiscoverySearchSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { FooterSection } from '@/components/landing/FooterSection';
import { RoleProvider } from '@/components/landing/RoleContext';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <RoleProvider>
          <AnnouncementStrip />
          <HeroSection />
          <DiscoverySearchSection />
          <HowItWorksSection />
        </RoleProvider>
        <TrustSection />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <FooterSection />
    </>
  );
}