import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import NumbersBar from "@/components/landing/NumbersBar";
import Problem from "@/components/landing/Problem";
import HowItWorks from "@/components/landing/HowItWorks";
import Integrations from "@/components/landing/Integrations";
import AISetup from "@/components/landing/AISetup";
import Comparison from "@/components/landing/Comparison";
import Pricing from "@/components/landing/Pricing";
import SocialProof from "@/components/landing/SocialProof";
import Reviews from "@/components/landing/Reviews";
import FAQ from "@/components/landing/FAQ";
import Roadmap from "@/components/landing/Roadmap";
import Close from "@/components/landing/Close";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <NumbersBar />
      <Problem />
      <HowItWorks />
      <Integrations />
      <AISetup />
      <Comparison />
      <Pricing />
      <SocialProof />
      <Reviews />
      <FAQ />
      <Roadmap />
      <Close />
      <Footer />
    </>
  );
}
