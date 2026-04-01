import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isAdmin: boolean;
  login: (pw: string) => boolean;
  logout: () => void;
}

export default function AdminAcceso({ isAdmin, login, logout }: Props) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleLogin = () => {
    if (login(password)) {
      toast({ title: "Acceso concedido", description: "Ahora tienes permisos de administrador." });
      setPassword("");
      setErrorMsg(false);
    } else {
      setPassword("");
      setErrorMsg(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setErrorMsg(false), 2000);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto space-y-6 pt-10">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-white tracking-widest uppercase">Admin</h1>
        <p className="text-[#9eb7d4] text-xs">Acceso reservado</p>
      </div>

      <Card className="glass-card rounded-2xl p-6 border-[#9eb7d4]/20 text-center space-y-5 shadow-xl shadow-black/20" style={{ backgroundColor: "rgba(0, 28, 71, 0.85)" }}>
        {isAdmin ? (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#7a0000]/20 flex items-center justify-center border border-[#7a0000]/30">
                <Unlock className="w-10 h-10 text-[#fcd5ce]" />
              </div>
            </div>
            <div>
              <p className="text-white font-medium text-lg">Modo Administrador</p>
              <p className="text-[#9eb7d4] text-xs mt-1">Puedes crear, editar y eliminar eventos, miembros y asignaciones.</p>
            </div>
            <Button onClick={logout} className="w-full bg-[#001233]/80 border border-[#9eb7d4]/30 hover:bg-[#9eb7d4]/10 text-white rounded-xl h-12 mt-2">
              Cerrar Sesión Admin
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#001233]/80 flex items-center justify-center border border-[#9eb7d4]/20">
                <Lock className="w-10 h-10 text-[#9eb7d4]" />
              </div>
            </div>
            <p className="text-[#9eb7d4] text-sm">Ingresa la clave para desbloquear privilegios de edición.</p>
            <Input 
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white rounded-xl text-center h-12 text-lg tracking-widest placeholder:tracking-normal"
            />
            <div className="h-5 flex items-center justify-center my-0.5">
              {errorMsg && <p className="text-red-400 font-bold text-sm">❌ Incorrecto</p>}
            </div>
            <Button onClick={handleLogin} className="w-full bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl h-12 text-sm font-semibold shadow-lg shadow-[#7a0000]/20">
              Ingresar
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
