import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import Planificador from "@/components/Planificador";
import Equipo from "@/components/Equipo";
import AdminAcceso from "@/components/AdminAcceso";
import { LayoutDashboard, CalendarDays, Users, Lock } from "lucide-react";

type Tab = "dashboard" | "planificador" | "equipo" | "admin";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    key: "planificador",
    label: "Planificador",
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    key: "equipo",
    label: "Equipo",
    icon: <Users className="w-5 h-5" />,
  },
  {
    key: "admin",
    label: "Acceso Admin",
    icon: <Lock className="w-5 h-5" />,
  },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("isAdmin") === "true";
  });

  const loginAdmin = (password: string) => {
    // Leemos la contraseña directamente de tu archivo .env para que no se suba a GitHub
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || "";
    if (password.trim().toLowerCase() === correctPassword.toLowerCase() && correctPassword !== "") {
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
  };

  return (
    <div className="min-h-screen bg-[#001233] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "planificador" && <Planificador isAdmin={isAdmin} />}
        {activeTab === "equipo" && <Equipo isAdmin={isAdmin} />}
        {activeTab === "admin" && (
          <AdminAcceso isAdmin={isAdmin} login={loginAdmin} logout={logoutAdmin} />
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-[#9eb7d4]/20 z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === tab.key
                  ? "text-white bg-[#7a0000]/80"
                  : "text-[#9eb7d4] hover:text-white"
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}