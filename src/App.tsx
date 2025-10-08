import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateProposal from "./pages/CreateProposal";
// Removed ProposalEditor - using content editor for editing
import Settings from "./pages/Settings";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Solutions from "./pages/Solutions";
import Checkout from "./pages/Checkout";
import SharedProposal from "./pages/SharedProposal";
import ProposalPreview from "./pages/ProposalPreview";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SubscriptionGuard from "./components/auth/SubscriptionGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<SubscriptionGuard><Dashboard /></SubscriptionGuard>} />
            <Route path="/create-proposal" element={<SubscriptionGuard><CreateProposal /></SubscriptionGuard>} />
            <Route path="/proposal/:id" element={<SubscriptionGuard><ProposalPreview /></SubscriptionGuard>} />
            <Route path="/preview/:id" element={<SubscriptionGuard><ProposalPreview /></SubscriptionGuard>} />
            <Route path="/settings" element={<SubscriptionGuard><Settings /></SubscriptionGuard>} />
            <Route path="/profile" element={<SubscriptionGuard><Settings /></SubscriptionGuard>} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/shared/:token" element={<SharedProposal />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
