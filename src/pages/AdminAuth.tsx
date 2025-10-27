import { WalletConnect } from "@/components/WalletConnect";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminAuth = () => {
  const { loggedIn, showOnboarding, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedIn && !showOnboarding) {
      if (userRole && userRole !== 'admin') {
        navigate('/lobby');
      } else {
        navigate('/platform/admin');
      }
    }
  }, [loggedIn, showOnboarding, navigate, userRole]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Portal</h1>
      {!loggedIn && (
        <div className="max-w-md mx-auto">
          <p className="text-center mb-4">Connect your wallet to sign up or log in as an Admin.</p>
          <WalletConnect role="admin" />
        </div>
      )}
      {loggedIn && showOnboarding && (
        <div className="text-center">
            <p>Admin onboarding is not required.</p>
        </div>
      )}
    </div>
  );
};

export default AdminAuth;
