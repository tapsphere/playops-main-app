import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AriaButton } from "@/components/AriaButton";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
      {/* ARIA Access Button */}
      <AriaButton />
      
      {/* Grid background effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--neon-green)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--neon-green)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="text-center space-y-6 relative z-10 px-4">
        <div className="w-24 h-24 mx-auto rounded-lg bg-black border-2 flex items-center justify-center mb-6" style={{ borderColor: 'hsl(var(--neon-green))' }}>
          <AlertCircle className="w-12 h-12" style={{ color: 'hsl(var(--neon-green))' }} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold tracking-widest text-glow-green mb-4" style={{ color: 'hsl(var(--neon-green))' }}>
          404
        </h1>
        
        <p className="text-xl md:text-2xl font-mono mb-4" style={{ color: 'hsl(var(--neon-green) / 0.8)' }}>
          SECTOR NOT FOUND
        </p>
        
        <p className="text-sm font-mono mb-8" style={{ color: 'hsl(var(--neon-green) / 0.5)' }}>
          The coordinates you entered don't exist in the PlayOps system
        </p>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/lobby')}
          className="border-2 bg-transparent hover:bg-primary/20 text-lg tracking-widest px-8 py-6 font-bold transition-all duration-300 group"
          style={{ 
            borderColor: 'hsl(var(--neon-green))',
            color: 'hsl(var(--neon-green))'
          }}
        >
          <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          RETURN TO HUB
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
