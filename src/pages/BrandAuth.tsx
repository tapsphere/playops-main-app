
import { BrandOnboardingForm } from "@/components/BrandOnboardingForm";
import { WalletConnect } from "@/components/WalletConnect";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BrandAuth = () => {
  const { loggedIn, showOnboarding, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedIn && !showOnboarding) {
      if (userRole && userRole !== 'brand') {
        navigate('/lobby');
      } else {
        navigate('/platform/brand');
      }
    }
  }, [loggedIn, showOnboarding, navigate, userRole]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Brand Hub</h1>
      {!loggedIn && (
        <div className="max-w-md mx-auto">
          <p className="text-center mb-4">Connect your wallet to sign up or log in as a Brand.</p>
          <WalletConnect role="brand" />
        </div>
      )}
      {loggedIn && showOnboarding && (
        <BrandOnboardingForm />
      )}
    </div>
  );
};

export default BrandAuth;
