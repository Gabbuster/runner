import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";

import Home from "@/pages/Home";
import ActiveRun from "@/pages/ActiveRun";
import RunDetails from "@/pages/RunDetails";
import Activity from "@/pages/Activity";
import Statistics from "@/pages/Statistics";
import Badges from "@/pages/Badges";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="text-foreground bg-background min-h-screen font-sans selection:bg-primary/20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/active-run">
            <div className="fixed inset-0 z-50 bg-background animate-slide-up">
              <ActiveRun />
            </div>
          </Route>
          <Route path="/run/:id" component={RunDetails} />
          <Route path="/activity" component={Activity} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/badges" component={Badges} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
        <BottomNav />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
