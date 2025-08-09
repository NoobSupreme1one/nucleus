import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import MealPlanner from "@mockup/ai_meal_planner_landing_page_react_tailwind";
import Sustainable from "@mockup/sustainable_packaging_marketplace_landing_page_react_tailwind";
import RemoteEnergyDual from "@mockup/dual_landing_pages_remote_collaboration_smart_energy";
import Energy from "@mockup/smart_home_energy_optimizer_landing_page_react_tailwind_shadcn_ui";
import TeenMental from "@mockup/landing_page_teen_mental_health_chatbot";
import BlockchainVoting from "@mockup/blockchain_voting_landing_page_react_tailwind";

interface MockProps {
  params: { slug: string };
}

const slugToComponent: Record<string, React.ComponentType> = {
  "ai-meal-planner": MealPlanner,
  "sustainable-packaging": Sustainable,
  "remote-collab": RemoteEnergyDual,
  "smart-energy": Energy,
  "teen-mental-health": TeenMental,
  "blockchain-voting": BlockchainVoting,
};

export default function MockLanding({ params }: MockProps) {
  const [, setLocation] = useLocation();
  const Comp = slugToComponent[params.slug];

  if (!Comp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto">
            <i className="fas fa-circle-exclamation text-white text-2xl" />
          </div>
          <p className="text-muted-foreground">Unknown mockup: {params.slug}</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/70 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/")}>← Back</Button>
          <div className="text-sm text-muted-foreground">Mockup preview</div>
          <div />
        </div>
      </div>
      <Comp />
    </div>
  );
}

