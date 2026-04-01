export interface Miembro {
    id: number;
    nombre: string;
  }
  
  export interface Area {
    id: number;
    nombre: string;
  }
  
  export interface Evento {
    id: number;
    nombre: string;
    fecha_texto: string;
    hora: string;
    tipo: string;
  }
  
  export interface Habilidad {
    miembro_id: number;
    area_id: number;
  }
  
  export interface Asignacion {
    evento_id: number;
    miembro_id: number;
    area_id: number;
  }
  
  // Area names mapped to icons
  export const AREA_NAMES = [
    "Luces",
    "Proyección",
    "Transmisión",
    "Fotos",
    "Cámara fija",
    "Cámara móvil",
    "Sonido",
  ] as const;