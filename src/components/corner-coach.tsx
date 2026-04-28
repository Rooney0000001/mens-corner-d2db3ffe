import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

// Floating button — navigates to the dedicated /coach page
export function CornerCoach() {
  return (
    <Link
      to="/coach"
      aria-label="Talk to Corner Coach"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-gold transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
    </Link>
  );
}
