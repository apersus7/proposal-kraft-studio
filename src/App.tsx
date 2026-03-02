import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded routes for code splitting
const Index = lazy(() => import("./pages/Index"));

const AppLayout = lazy(() => import("./components/AppLayout"));
const CreateProposal = lazy(() => import("./pages/CreateProposal"));
const Settings = lazy(() => import("./pages/Settings"));
const Features = lazy(() => import("./pages/Features"));
const Solutions = lazy(() => import("./pages/Solutions"));
const SharedProposal = lazy(() => import("./pages/SharedProposal"));
const ProposalPreview = lazy(() => import("./pages/ProposalPreview"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contact = lazy(() => import("./pages/Contact"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Integrations = lazy(() => import("./pages/Integrations"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const ProposalsDashboard = lazy(() => import("./pages/ProposalsDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
              <Route path="/create-proposal" element={<ProtectedRoute><CreateProposal /></ProtectedRoute>} />
              <Route path="/proposal/:id" element={<ProtectedRoute><ProposalPreview /></ProtectedRoute>} />
              <Route path="/preview/:id" element={<ProtectedRoute><ProposalPreview /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
              <Route path="/company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
              <Route path="/proposals" element={<ProtectedRoute><ProposalsDashboard /></ProtectedRoute>} />
              <Route path="/features" element={<Features />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/shared/:token" element={<SharedProposal />} />
              <Route path="/p/:token" element={<SharedProposal />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
