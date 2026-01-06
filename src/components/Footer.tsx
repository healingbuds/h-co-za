import PreFooterCTA from "@/components/PreFooterCTA";
import FooterMinimal from "@/components/FooterMinimal";

const Footer = () => {
  return (
    <div id="contact" className="relative" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
      <PreFooterCTA />
      <FooterMinimal />
    </div>
  );
};

export default Footer;
