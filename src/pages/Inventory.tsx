import {
  Package,
  Trophy,
  FileCheck,
  Download,
  Sparkles,
  Hexagon,
  Home,
  User,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerHeader from "@/components/ui/PlayerHeader";
import { supabase } from "@/integrations/supabase/client";
import microsoftLogo from "@/assets/logos/microsoft.png";
import adobeLogo from "@/assets/logos/adobe.png";
import salesforceLogo from "@/assets/logos/salesforce.png";
import hubspotLogo from "@/assets/logos/hubspot.png";

const mockReceipts = [
  {
    id: "R-2025-001",
    skill: "Analytical Thinking / Critical Reasoning",
    level: "Mastery",
    date: "2025-03-15",
    validator: "Microsoft",
  },
  { id: "R-2025-002", skill: "AI & Big Data Skills", level: "Proficient", date: "2025-03-10", validator: "Salesforce" },
  { id: "R-2025-003", skill: "Technological Literacy", level: "Mastery", date: "2025-02-28", validator: "Adobe" },
  { id: "R-2025-004", skill: "Creative Thinking", level: "Proficient", date: "2025-02-20", validator: "HubSpot" },
  {
    id: "R-2025-005",
    skill: "Leadership & Social Influence",
    level: "Mastery",
    date: "2025-03-05",
    validator: "Monday.com",
  },
];

const mockBadges = [
  { name: "Analytical Master", icon: "📊", level: "mastery", earned: "2025-03", type: "emoji" },
  { name: "Microsoft Certified", icon: microsoftLogo, level: "mastery", earned: "2025-03", type: "brand" },
  { name: "AI Data Pro", icon: "🤖", level: "mastery", earned: "2025-03", type: "emoji" },
  { name: "Adobe Creative", icon: adobeLogo, level: "proficient", earned: "2025-02", type: "brand" },
  { name: "Tech Literacy", icon: "💻", level: "proficient", earned: "2025-02", type: "emoji" },
  { name: "Salesforce Expert", icon: salesforceLogo, level: "proficient", earned: "2025-02", type: "brand" },
  { name: "Security Pro", icon: "🔒", level: "needs-work", earned: "2025-01", type: "emoji" },
  { name: "HubSpot Marketing", icon: hubspotLogo, level: "proficient", earned: "2025-01", type: "brand" },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case "mastery":
      return "bg-black border-green-500 text-green-400";
    case "proficient":
      return "bg-black border-green-500 text-green-400";
    default:
      return "bg-black text-red-400 border-red-500";
  }
};

const getLevelLabel = (level: string) => {
  switch (level) {
    case "mastery":
      return "Mastery";
    case "proficient":
      return "Proficient";
    default:
      return "Needs Work";
  }
};

const Inventory = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(2);
  const [totalXp, setTotalXp] = useState(0);
  const [totalPlyo, setTotalPlyo] = useState(0);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('loadProfileData: No user found');
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('total_xp, total_plyo')
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        if (data) {
          setTotalXp(data.total_xp || 0);
          setTotalPlyo(data.total_plyo || 0);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  const menuItems = [
    { icon: Home, label: "Hub", path: "/lobby" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Hexagon, label: "Inventory", path: "/inventory" },
    { icon: TrendingUp, label: "Leaderboard", path: "/leaderboard" },
    { icon: Wallet, label: "Wallet", path: "/wallet" },
  ];

  const handleNavigation = (path: string, index: number) => {
    setActiveIndex(index);
    navigate(path);
  };
  return (
    <div className="relative w-full min-h-screen bg-black pb-24">
      <PlayerHeader totalXp={totalXp} totalPlyo={totalPlyo} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="w-full bg-black/50 border-2 mb-6" style={{ borderColor: "hsl(var(--neon-green))" }}>
            <TabsTrigger value="badges" className="flex-1 data-[state=active]:bg-primary/20">
              <Trophy className="w-5 h-5 mr-2" style={{ color: "hsl(var(--neon-green))" }} strokeWidth={2.5} />
              Badges
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex-1 data-[state=active]:bg-primary/20">
              <FileCheck className="w-5 h-5 mr-2" style={{ color: "hsl(var(--neon-green))" }} strokeWidth={2.5} />
              Receipts
            </TabsTrigger>
          </TabsList>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mockBadges.map((badge, idx) => {
                return (
                  <Card
                    key={idx}
                    className="flex flex-col items-center text-center hover:scale-105 transition-all cursor-pointer bg-transparent border-2 p-4"
                    style={{ borderColor: "hsl(var(--neon-green))" }}
                  >
                    {/* Telegram-style sticker - no border */}
                    <div className="w-20 h-20 mb-3 flex items-center justify-center">
                      {badge.type === "emoji" ? (
                        <div className="text-6xl">{badge.icon}</div>
                      ) : (
                        <div
                          className="w-full h-full rounded-2xl p-2 bg-white flex items-center justify-center"
                          style={{
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          }}
                        >
                          <img src={badge.icon as string} alt={badge.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-xs mb-1" style={{ color: "hsl(var(--neon-green))" }}>
                      {badge.name}
                    </h3>
                    <Badge
                      className="mb-1 border-2 font-mono text-[9px] bg-black/50"
                      style={{ borderColor: "hsl(var(--neon-purple))", color: "hsl(var(--neon-purple))" }}
                    >
                      CBE
                    </Badge>
                    <Badge
                      className={`mb-1 border-2 font-mono text-[10px] ${getLevelColor(badge.level)}`}
                      style={{ borderColor: "hsl(var(--neon-green))" }}
                    >
                      {getLevelLabel(badge.level)}
                    </Badge>
                    <div className="text-[10px] font-mono" style={{ color: "hsl(var(--neon-green) / 0.7)" }}>
                      {badge.earned}
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card
              className="bg-black/50 border-2 p-6 text-center relative overflow-hidden group"
              style={{ borderColor: "hsl(var(--neon-green))" }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                style={{
                  background: "radial-gradient(circle at center, hsl(var(--neon-green)), transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-lg bg-black border-2 flex items-center justify-center"
                  style={{ borderColor: "hsl(var(--neon-green))" }}
                >
                  <Sparkles className="w-8 h-8" style={{ color: "hsl(var(--neon-green))" }} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-wide" style={{ color: "hsl(var(--neon-green))" }}>
                  {mockBadges.length} Badges Collected
                </h3>
                <p className="text-sm font-mono" style={{ color: "hsl(var(--neon-green) / 0.7)" }}>
                  Complete more validators to unlock rare badges
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-4">
            {mockReceipts.map((receipt) => (
              <Card
                key={receipt.id}
                className="bg-black/50 border-2 p-6 hover:bg-black/70 transition-all"
                style={{ borderColor: "hsl(var(--neon-green))" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="w-5 h-5" style={{ color: "hsl(var(--neon-green))" }} strokeWidth={2.5} />
                      <span className="font-mono text-sm" style={{ color: "hsl(var(--neon-green) / 0.7)" }}>
                        {receipt.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-glow-green mb-1" style={{ color: "hsl(var(--neon-green))" }}>
                      {receipt.skill}
                    </h3>
                    <div className="flex gap-2 mb-2">
                      <Badge
                        className="border-2 font-mono text-[9px] bg-black/50"
                        style={{ borderColor: "hsl(var(--neon-purple))", color: "hsl(var(--neon-purple))" }}
                      >
                        CBE
                      </Badge>
                      <Badge
                        variant="outline"
                        style={{ borderColor: "hsl(var(--neon-green))", color: "hsl(var(--neon-green))" }}
                      >
                        {receipt.validator}
                      </Badge>
                      <Badge
                        className={
                          receipt.level === "Mastery"
                            ? "bg-green-500/20 text-green-400 border-green-500"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500"
                        }
                      >
                        {receipt.level}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono" style={{ color: "hsl(var(--neon-green) / 0.5)" }}>
                      Validated: {receipt.date}
                    </p>
                  </div>
                  <button
                    className="p-2 border-2 rounded-lg hover:bg-primary/20 transition-all hover:scale-110"
                    style={{ borderColor: "hsl(var(--neon-green))" }}
                  >
                    <Download className="w-5 h-5" style={{ color: "hsl(var(--neon-green))" }} strokeWidth={2.5} />
                  </button>
                </div>
                <div
                  className="text-xs font-mono p-3 bg-black/50 rounded border"
                  style={{ borderColor: "hsl(var(--neon-green) / 0.3)", color: "hsl(var(--neon-green) / 0.6)" }}
                >
                  🔐 Immutable on-chain receipt • Timestamp: {receipt.date}
                </div>
              </Card>
            ))}

            <Card
              className="bg-black/50 border-2 p-6 text-center relative overflow-hidden group"
              style={{ borderColor: "hsl(var(--neon-green))" }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                style={{
                  background: "radial-gradient(circle at center, hsl(var(--neon-green)), transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-lg bg-black border-2 flex items-center justify-center"
                  style={{ borderColor: "hsl(var(--neon-green))" }}
                >
                  <FileCheck className="w-8 h-8" style={{ color: "hsl(var(--neon-green))" }} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-wide" style={{ color: "hsl(var(--neon-green))" }}>
                  {mockReceipts.length} Validated Skills
                </h3>
                <p className="text-sm font-mono mb-4" style={{ color: "hsl(var(--neon-green) / 0.7)" }}>
                  Portable proof employers can verify instantly
                </p>
                <button
                  className="px-6 py-2 border-2 rounded-lg font-mono font-bold hover:bg-primary/20 transition-all hover:scale-105"
                  style={{ borderColor: "hsl(var(--neon-green))", color: "hsl(var(--neon-green))" }}
                >
                  EXPORT ALL RECEIPTS
                </button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t-2 bg-black/95 backdrop-blur-lg z-50"
        style={{ borderColor: "hsl(var(--neon-green))" }}
      >
        <nav className="flex items-center justify-around px-2 py-2 max-w-screen-xl mx-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;
            const usePurple = index === 2;
            const accentColor = usePurple ? "hsl(var(--neon-purple))" : "hsl(var(--neon-green))";
            const glowClass = usePurple ? "text-glow-purple" : "text-glow-green";

            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path, index)}
                className="flex flex-col items-center gap-1 flex-1 max-w-[90px] group transition-all duration-300 relative"
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-lg opacity-20 blur-md" style={{ background: accentColor }} />
                )}
                <div
                  className={`
                    relative p-2.5 rounded-lg border-2 transition-all duration-300
                    ${isActive ? "bg-primary/20 scale-110" : "border-transparent hover:bg-primary/10 hover:border-primary/30"}
                  `}
                  style={isActive ? { borderColor: accentColor } : {}}
                >
                  <Icon
                    className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isActive ? glowClass : ""}`}
                    style={{ color: accentColor }}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`text-[10px] md:text-xs font-mono transition-all duration-300 truncate w-full text-center ${isActive ? glowClass + " font-bold" : ""}`}
                  style={{ color: accentColor }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Inventory;
