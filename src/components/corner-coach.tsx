import { Link } from "@tanstack/react-router";
import logo from "@/assets/mens-corner-logo.png";

// Floating button — navigates to the dedicated /coach page
export function CornerCoach() {
  return (
    <Link
      to="/coach"
      aria-label="Talk to Corner Coach"
      className="group fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-background shadow-gold transition-transform hover:scale-105"
    >
      <img
        src={logo}
        alt="Corner Coach"
        className="h-14 w-14 object-contain transition-transform group-hover:scale-105"
      />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
      </span>
    </Link>
  );
}
