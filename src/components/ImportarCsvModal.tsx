import { useRef, useState } from "react";
import Papa from "papaparse";
import { X, UploadCloud, Download } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { ESPECIALIDADES, ESTADOS, TIPOS_PACIENTE } from "../types";
import type { Medico } from "../types";

/**
 * Encabezados aceptados en el CSV, en español, sin acentos y en
 * minúsculas (así se comparan). Cada campo del sistema puede
 * reconocerse con más de un nombre de columna, para tolerar variaciones
 * razonables del archivo que la persona suba.
 */
const MAPEO_COLUMNAS: Record<string, string[]> = {
  paciente_nombre: ["nombre del paciente", "paciente", "nombre paciente", "nombre"],
  paciente_edad: ["edad"],
  codigo_cliente: ["codigo de cliente", "codigo cliente", "código de cliente"],
  especialidad: ["especialidad"],
  diagnostico_procedimiento: ["diagnostico o procedimiento", "diagnostico / procedimiento", "diagnostico", "procedimiento"],
  medico: ["medico solicitante", "medico", "médico solicitante"],
  tipo_paciente: ["tipo de paciente", "tipo paciente", "cobertura"],
  seguro: ["aseguradora", "aseguradora / institucion", "seguro", "institucion"],
  metodo_pago: ["metodo de pago", "metodo pago"],
  monto: ["monto", "monto estimado"],
  estado: ["estado"],
};

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function encontrarEnLista(valor: string, lista: readonly string[]): string | null {
  const norm = normalizar(valor);
  return lista.find((item) => normalizar(item) === norm) || null;
}

interface FilaValidada {
  numeroFila: number;
  original: Record<string, string>;
  errores: string[];
  payload?: {
    paciente_nombre: string;
    paciente_edad: number | null;
    codigo_cliente: string | null;
    especialidad: string;
    diagnostico_procedimiento: string;
    medicoNombre: string | null;
    tipo_paciente: string;
    seguro: string | null;
    metodo_pago: string;
    monto: number;
    estado: string;
  };
}

function construirIndiceColumnas(headers: string[]) {
  const indice: Record<string, string> = {}; // campo -> header original
  for (const header of headers) {
    const norm = normalizar(header);
    for (const [campo, variantes] of Object.entries(MAPEO_COLUMNAS)) {
      if (variantes.includes(norm) && !indice[campo]) {
        indice[campo] = header;
      }
    }
  }
  return indice;
}

function validarFilas(filas: Record<string, string>[], indice: Record<string, string>): FilaValidada[] {
  return filas.map((fila, i) => {
    const errores: string[] = [];
    const get = (campo: string) => (indice[campo] ? (fila[indice[campo]] || "").trim() : "");

    const paciente_nombre = get("paciente_nombre");
    if (!paciente_nombre) errores.push("Falta el nombre del paciente.");

    const diagnostico_procedimiento = get("diagnostico_procedimiento");
    if (!diagnostico_procedimiento) errores.push("Falta el diagnóstico o procedimiento.");

    const especialidadTexto = get("especialidad");
    const especialidad = especialidadTexto ? encontrarEnLista(especialidadTexto, ESPECIALIDADES) : null;
    if (!especialidadTexto) errores.push("Falta la especialidad.");
    else if (!especialidad) errores.push(`Especialidad no reconocida: "${especialidadTexto}".`);

    const tipoPacienteTexto = get("tipo_paciente");
    let tipo_paciente = TIPOS_PACIENTE[0] as string;
    if (tipoPacienteTexto) {
      const encontrado = encontrarEnLista(tipoPacienteTexto, TIPOS_PACIENTE);
      if (!encontrado) errores.push(`Tipo de paciente no reconocido: "${tipoPacienteTexto}".`);
      else tipo_paciente = encontrado;
    }

    const estadoTexto = get("estado");
    let estado = ESTADOS[0] as string;
    if (estadoTexto) {
      const encontrado = encontrarEnLista(estadoTexto, ESTADOS);
      if (!encontrado) errores.push(`Estado no reconocido: "${estadoTexto}".`);
      else estado = encontrado;
    }

    const edadTexto = get("paciente_edad");
    let paciente_edad: number | null = null;
    if (edadTexto) {
      const n = parseInt(edadTexto, 10);
      if (isNaN(n)) errores.push(`La edad "${edadTexto}" no es un número.`);
      else paciente_edad = n;
    }

    const montoTexto = get("monto");
    let monto = 0;
    if (montoTexto) {
      const n = parseFloat(montoTexto.replace(/[^\d.-]/g, ""));
      if (isNaN(n)) errores.push(`El monto "${montoTexto}" no es un número.`);
      else monto = n;
    }

    const medicoNombre = get("medico") || null;
    const codigo_cliente = get("codigo_cliente") || null;
    const seguro = get("seguro") || null;
    const metodo_pago = get("metodo_pago") || "Efectivo";

    const filaValidada: FilaValidada = { numeroFila: i + 2, original: fila, errores };
    if (errores.length === 0) {
      filaValidada.payload = {
        paciente_nombre,
        paciente_edad,
        codigo_cliente,
        especialidad: especialidad!,
        diagnostico_procedimiento,
        medicoNombre,
        tipo_paciente,
        seguro,
        metodo_pago,
        monto,
        estado,
      };
    }
    return filaValidada;
  });
}

function descargarPlantilla() {
  const encabezados = [
    "Nombre del paciente",
    "Edad",
    "Codigo de cliente",
    "Especialidad",
    "Diagnostico o procedimiento",
    "Medico solicitante",
    "Tipo de paciente",
    "Aseguradora",
    "Metodo de pago",
    "Monto",
    "Estado",
  ];
  const ejemplo = [
    "Rosario Áñez", "41", "CL-1042", ESPECIALIDADES[7], "Abdominoplastia post bariátrica",
    "JAVIER MERCADO GORDILLO", "Privado", "", "Efectivo", "8500", "Cirugía Cotizada",
  ];
  const csv = Papa.unparse({ fields: encabezados, data: [ejemplo] });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla-oportunidades.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportarCsvModal({
  medicos,
  onClose,
  onImportado,
}: {
  medicos: Medico[];
  onClose: () => void;
  onImportado: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [paso, setPaso] = useState<"seleccionar" | "revisando" | "listo" | "importando" | "completado">("seleccionar");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [filas, setFilas] = useState<FilaValidada[]>([]);
  const [resultado, setResultado] = useState<{ ok: number; fallidas: number } | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  function manejarArchivo(file: File) {
    setNombreArchivo(file.name);
    setErrorGeneral(null);
    setPaso("revisando");
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const indice = construirIndiceColumnas(headers);
        if (!indice.paciente_nombre || !indice.especialidad || !indice.diagnostico_procedimiento) {
          setErrorGeneral(
            "El archivo no tiene las columnas mínimas requeridas (Nombre del paciente, Especialidad, Diagnóstico o procedimiento). Descarga la plantilla para ver el formato esperado."
          );
          setPaso("seleccionar");
          return;
        }
        const validadas = validarFilas(results.data, indice);
        setFilas(validadas);
        setPaso("listo");
      },
      error: (err: Error) => {
        setErrorGeneral("No se pudo leer el archivo: " + err.message);
        setPaso("seleccionar");
      },
    });
  }

  async function importar() {
    setPaso("importando");
    const medicoCache = new Map<string, string>();
    for (const m of medicos) medicoCache.set(m.nombre.toUpperCase(), m.id);

    let ok = 0;
    let fallidas = 0;

    for (const fila of filas) {
      if (!fila.payload) {
        fallidas++;
        continue;
      }
      try {
        let medicoId: string | null = null;
        if (fila.payload.medicoNombre) {
          const upper = fila.payload.medicoNombre.toUpperCase();
          if (medicoCache.has(upper)) {
            medicoId = medicoCache.get(upper)!;
          } else {
            const { data: existente } = await supabase.from("medicos").select("id").eq("nombre", upper).maybeSingle();
            if (existente) {
              medicoId = existente.id;
            } else {
              const { data: creado } = await supabase.from("medicos").insert({ nombre: upper }).select("id").single();
              medicoId = creado?.id || null;
            }
            if (medicoId) medicoCache.set(upper, medicoId);
          }
        }

        const { error } = await supabase.from("oportunidades").insert({
          paciente_nombre: fila.payload.paciente_nombre,
          paciente_edad: fila.payload.paciente_edad,
          codigo_cliente: fila.payload.codigo_cliente,
          especialidad: fila.payload.especialidad,
          diagnostico_procedimiento: fila.payload.diagnostico_procedimiento,
          medico_id: medicoId,
          tipo_paciente: fila.payload.tipo_paciente,
          seguro: fila.payload.seguro,
          metodo_pago: fila.payload.metodo_pago,
          monto: fila.payload.monto,
          estado: fila.payload.estado,
        });
        if (error) {
          fallidas++;
        } else {
          ok++;
        }
      } catch {
        fallidas++;
      }
    }

    setResultado({ ok, fallidas });
    setPaso("completado");
    onImportado();
  }

  const validas = filas.filter((f) => f.errores.length === 0);
  const invalidas = filas.filter((f) => f.errores.length > 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="ef-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto ef-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <h2 className="ef-serif text-xl font-medium">Importar oportunidades desde CSV</h2>
          <button onClick={onClose} className="ef-btn-ghost p-1.5 rounded-sm">
            <X size={18} />
          </button>
        </div>

        {paso === "seleccionar" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[color:var(--slate-700)]">
              Sube un archivo CSV para cargar varias oportunidades a la vez. Las columnas mínimas
              son <strong>Nombre del paciente</strong>, <strong>Especialidad</strong> y{" "}
              <strong>Diagnóstico o procedimiento</strong>; el resto son opcionales.
            </p>
            <button
              onClick={descargarPlantilla}
              className="ef-btn-ghost text-sm font-semibold px-3 py-2 rounded-sm border border-[color:var(--line)] flex items-center gap-2 w-fit"
            >
              <Download size={15} /> Descargar plantilla de ejemplo
            </button>
            {errorGeneral && <div className="text-xs text-[color:var(--brick)]">{errorGeneral}</div>}
            <label className="ef-card border-dashed border-2 flex flex-col items-center justify-center gap-2 p-8 cursor-pointer text-center">
              <UploadCloud size={28} color="var(--green-700)" />
              <span className="text-sm font-semibold">Haz clic para elegir un archivo .csv</span>
              <span className="text-xs text-[color:var(--slate-500)]">o arrástralo aquí</span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && manejarArchivo(e.target.files[0])}
              />
            </label>
          </div>
        )}

        {paso === "revisando" && (
          <div className="py-10 text-center text-sm text-[color:var(--slate-500)]">Leyendo {nombreArchivo}…</div>
        )}

        {paso === "listo" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="ef-card p-3 flex-1 text-center">
                <div className="ef-serif text-xl font-medium" style={{ color: "var(--teal)" }}>
                  {validas.length}
                </div>
                <div className="text-xs text-[color:var(--slate-500)]">Listas para importar</div>
              </div>
              <div className="ef-card p-3 flex-1 text-center">
                <div className="ef-serif text-xl font-medium" style={{ color: "var(--brick)" }}>
                  {invalidas.length}
                </div>
                <div className="text-xs text-[color:var(--slate-500)]">Con errores (se omitirán)</div>
              </div>
            </div>

            {invalidas.length > 0 && (
              <div className="ef-card p-3 max-h-48 overflow-y-auto ef-scrollbar flex flex-col gap-2">
                {invalidas.map((f) => (
                  <div key={f.numeroFila} className="text-xs">
                    <span className="font-semibold">Fila {f.numeroFila}:</span>{" "}
                    <span className="text-[color:var(--brick)]">{f.errores.join(" ")}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPaso("seleccionar");
                  setFilas([]);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="ef-btn-ghost text-sm font-semibold px-4 py-2 rounded-sm border border-[color:var(--line)]"
              >
                Elegir otro archivo
              </button>
              <button
                onClick={importar}
                disabled={validas.length === 0}
                className="ef-btn-primary rounded-sm px-4 py-2 text-sm font-semibold flex-1"
              >
                Importar {validas.length} {validas.length === 1 ? "oportunidad" : "oportunidades"}
              </button>
            </div>
          </div>
        )}

        {paso === "importando" && (
          <div className="py-10 text-center text-sm text-[color:var(--slate-500)]">Importando registros…</div>
        )}

        {paso === "completado" && resultado && (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              Importación completada: <strong>{resultado.ok}</strong> oportunidades creadas
              {resultado.fallidas > 0 && (
                <>
                  , <strong>{resultado.fallidas}</strong> no se pudieron guardar.
                </>
              )}
            </p>
            <button onClick={onClose} className="ef-btn-primary rounded-sm px-4 py-2 text-sm font-semibold">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
