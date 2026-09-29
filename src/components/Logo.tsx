/**
 * Logo institucional de CIES.
 * Los archivos viven en /public (servidos como estáticos por Vite):
 * - logo-cies-full.png: isotipo + wordmark, fondo transparente. Se usa en el login.
 * - logo-cies-icon.png: solo el isotipo, recortado y con fondo transparente.
 *   Se usa en la barra lateral y como marca de agua.
 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo-cies-icon.png"
      alt="Logo CIES"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

export function LogoFull({ height = 40 }: { height?: number }) {
  return <img src="/logo-cies-full.png" alt="CIES — Salud Sexual, Salud Reproductiva, Salud Integral" style={{ height }} />;
}

/**
 * Versión para usarse como marca de agua de gran tamaño y baja opacidad
 * (por ejemplo, en el centro del Dashboard). La opacidad se controla desde
 * donde se use el componente, no aquí, para poder ajustarla según el fondo.
 */
export function LogoWatermark({ size = 420 }: { size?: number }) {
  return <img src="/logo-cies-icon.png" alt="" width={size} height={size} style={{ objectFit: "contain" }} />;
}
