import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./components/ThemeProvider";
import { Navbar } from "./components/Navbar";
import PackShop from "./pages/PackShop";
import Collection from "./pages/Collection";
import Stats from "./pages/Stats";
import NotFound from "./pages/not-found";

function AppContent() {
  return (
    <Router hook={useHashLocation}>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-16">
          <Switch>
            <Route path="/" component={PackShop} />
            <Route path="/collection" component={Collection} />
            <Route path="/stats" component={Stats} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
