import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Lobby from "./pages/Lobby";
import Profile from "./pages/Profile";
import Inventory from "./pages/Inventory";
import Wallet from "./pages/Wallet";
import Leaderboard from "./pages/Leaderboard";
import VoiceChat from "./pages/VoiceChat";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import CreatorAuth from "./pages/platform/auth/CreatorAuth";
import BrandAuth from "./pages/platform/auth/BrandAuth";
import AdminAuth from "./pages/platform/auth/AdminAuth";
import Play from "./pages/Play";
import { PlatformLayout } from "./components/platform/PlatformLayout";
import CreatorDashboard from "./pages/platform/CreatorDashboard";
import BrandDashboard from "./pages/platform/BrandDashboard";
import AdminDashboard from "./pages/platform/AdminDashboard";
import ManagePlayers from "./pages/platform/admin/ManagePlayers";
import ManageBrands from "./pages/platform/admin/ManageBrands";
import ManageCreators from "./pages/platform/admin/ManageCreators";
import BrandProfileEdit from "./pages/platform/BrandProfileEdit";
import GameResults from "./pages/platform/GameResults";
import BrandProfile from "./pages/BrandProfile";
import Marketplace from "./pages/platform/Marketplace";
import CreatorPortfolio from "./pages/platform/CreatorPortfolio";
import { TemplateDetail } from "./pages/platform/TemplateDetail";
import ValidatorDemo from "./pages/ValidatorDemo";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PreviewPage from "./pages/Preview";

import { AuthProvider } from "./contexts/AuthContext";
import { CurrentUserRoleLogger } from "./components/CurrentUserRoleLogger";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <CurrentUserRoleLogger />
        <Routes>
          {/* Game Routes (Players) */}
          <Route path="/" element={<Index />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/voice-chat" element={<VoiceChat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          
          {/* Auth Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/creator" element={<CreatorAuth />} />
          <Route path="/auth/brand" element={<BrandAuth />} />
          <Route path="/auth/admin" element={<AdminAuth />} />

          {/* Platform Routes (Creators & Brands) */}
          <Route path="/platform" element={<PlatformLayout />}>
            <Route path="creator" element={<CreatorDashboard />} />
            <Route path="brand" element={<BrandDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/players" element={<ManagePlayers />} />
            <Route path="admin/brands" element={<ManageBrands />} />
            <Route path="admin/creators" element={<ManageCreators />} />
            <Route path="brand/profile-edit" element={<BrandProfileEdit />} />
            <Route path="brand/results/:customizationId" element={<GameResults />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="creator/:creatorId" element={<CreatorPortfolio />} />
            <Route path="template/:templateId" element={<TemplateDetail />} />
          </Route>
          
          {/* Public Brand Profile */}
          <Route path="/brand/:brandId" element={<BrandProfile />} />
          
          {/* Validator Demo */}
          <Route path="/validator-demo" element={<ValidatorDemo />} />
          <Route path="/preview" element={<PreviewPage />} />
          
          {/* Public Play Route */}
          <Route path="/play/:code" element={<Play />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
