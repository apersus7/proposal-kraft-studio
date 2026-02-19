import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AppLayout from "./components/AppLayout";
import CreateProposal from "./pages/CreateProposal";
import Settings from "./pages/Settings";
import Features from "./pages/Features";
import Solutions from "./pages/Solutions";
import SharedProposal from "./pages/SharedProposal";
import ProposalPreview from "./pages/ProposalPreview";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProtectedRoute from "./components/ProtectedRoute";
import Integrations from "./pages/Integrations";
import CompanyProfile from "./pages/CompanyProfile";

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
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
            <Route path="/create-proposal" element={<ProtectedRoute><CreateProposal /></ProtectedRoute>} />
            <Route path="/proposal/:id" element={<ProtectedRoute><ProposalPreview /></ProtectedRoute>} />
            <Route path="/preview/:id" element={<ProtectedRoute><ProposalPreview /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
            <Route path="/features" element={<Features />} />
            <Route path="/solutions" element={<Solutions />} />
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
