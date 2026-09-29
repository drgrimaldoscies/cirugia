export type Rol = "admin" | "staff";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Rol;
  created_at: string;
}

export const ESPECIALIDADES = [
  "Cirugía Cardiovascular",
  "Cirugía de Cabeza, Cuello y Maxilofacial",
  "Cirugía de Mano",
  "Cirugía Gastroenterológica y del Aparato Digestivo",
  "Cirugía General",
  "Cirugía Oncología (Oncocirugía)",
  "Cirugía Pediátrica",
  "Cirugía Plástica, Estética y Reparadora",
  "Cirugía Torácica",
  "Cirugía Vascular y Angiología",
  "Gastroenterología",
  "Ginecología y Obstetricia",
  "Ginecología y Oncología",
  "Mastología",
  "Medicina Interna",
  "Neurocirugía",
  "Oftalmología (Cirugía Ocular)",
  "Otorrinolaringología (Cirugía de Oído, Nariz y Garganta)",
  "Pediatría",
  "Proctología",
  "Traumatología y Cirugía Ortopédica",
  "Urología",
] as const;

// Los 6 estados del ciclo de vida de una oportunidad quirúrgica.
export const ESTADOS = [
  "Cirugía Cotizada",
  "Cirugía Programada",
  "Cotización con seguimiento",
  "Cirugía postergada",
  "Cirugía realizada",
  "Cirugía no convertida",
] as const;

// Estados que ya no admiten más gestión (fuera del embudo activo).
export const ESTADOS_TERMINALES = ["Cirugía realizada", "Cirugía no convertida"];

export const TIPOS_PACIENTE = [
  "Privado",
  "Asegurado o Convenio",
  "Institucional",
  "Seguridad Social",
] as const;

export const CANALES = [
  "WhatsApp",
  "Llamada Telefónica",
  "Contacto presencial",
  "Correo electrónico",
] as const;

export const CLASIFICACIONES_SEGUIMIENTO = ["Con seguimiento", "Sin seguimiento"] as const;

export const MEDICO_OTRO = "OTRO";

export interface Medico {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Oportunidad {
  id: string;
  numero_cotizacion: string;
  paciente_nombre: string;
  paciente_edad: number | null;
  codigo_cliente: string | null;
  especialidad: string;
  diagnostico_procedimiento: string;
  medico_id: string | null;
  medico_nombre?: string | null;
  tipo_paciente: string;
  seguro: string | null;
  metodo_pago: string;
  monto: number;
  estado: string;
  fecha_probable_cirugia: string | null;
  motivo_perdida: string | null;
  created_at: string;
  updated_at: string;
}

export interface Seguimiento {
  id: string;
  oportunidad_id: string;
  fecha: string;
  clasificacion: string | null;
  canal: string | null;
  responsable_id: string | null;
  responsable_nombre?: string | null;
  resultado: string | null;
  proxima_accion: string | null;
  fecha_proxima_accion: string | null;
  created_at: string;
}
