import { Link } from "react-router-dom";
import { ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const PreFooterCTA = () => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-4xl mx-auto">
        <div 
          className="rounded-3xl border px-6 py-10 md:px-12 md:py-14"
          style={{ 
            backgroundColor: '#0F3935',
            borderColor: '#1F4D47'
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            {/* Primary CTA - Check Eligibility */}
            <Button
              asChild
              className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-semibold bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-105"
            >
              <Link to="/eligibility" className="flex items-center gap-2">
                Check Eligibility
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>

            {/* Secondary CTA - Patient Login */}
            <Button
              asChild
              variant="ghost"
              className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-semibold text-white/90 border border-white/30 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <Link to="/auth" className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreFooterCTA;
