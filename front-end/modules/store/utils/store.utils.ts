import type { StoreEsignature } from "../types/store.types";

const LOWER_CHARS = "abcdefghijkmnopqrstuvwxyz";
const UPPER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGIT_CHARS = "23456789";
const SYMBOL_CHARS = "!@#$%";

/**
 * Membuat ID unik untuk entitas mock (prefix + timestamp + random).
 */
export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function pickRandomChar(charset: string): string {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return charset[buffer[0] % charset.length];
}

/**
 * Membuat password sementara acak yang selalu memenuhi kebijakan password
 * (huruf besar, huruf kecil, angka, simbol). Tidak pernah disimpan.
 */
export function generateTemporaryPassword(length = 12): string {
  const all = LOWER_CHARS + UPPER_CHARS + DIGIT_CHARS + SYMBOL_CHARS;
  const chars: string[] = [
    pickRandomChar(UPPER_CHARS),
    pickRandomChar(LOWER_CHARS),
    pickRandomChar(DIGIT_CHARS),
    pickRandomChar(SYMBOL_CHARS),
  ];
  while (chars.length < length) {
    chars.push(pickRandomChar(all));
  }
  // Fisher-Yates shuffle menggunakan crypto random.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    const j = buffer[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/**
 * Membuat kode verifikasi tanda tangan digital berbasis SHA-256 dari seed.
 * Format: TJR-XXXX-XXXX-XXXX
 */
export async function generateVerificationCode(seed: string): Promise<string> {
  const data = new TextEncoder().encode(seed);
  let hex: string;

  // crypto.subtle hanya tersedia di secure context (HTTPS/localhost).
  // Akses via IP LAN (http) memakai fallback FNV-1a agar fitur tetap jalan.
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  } else {
    let hash = 0x811c9dc5;
    data.forEach((byte) => {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    });
    hex = (hash.toString(16).padStart(8, "0") + Date.now().toString(16)).toUpperCase();
  }
  return `TJR-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/**
 * Payload teks yang dikodekan ke dalam QR/barcode tanda tangan.
 * Bisa dibaca scanner mana pun dan dicocokkan lewat kode verifikasi.
 */
export function buildSignaturePayload(
  signature: Pick<StoreEsignature, "verificationCode" | "signer" | "signerName" | "timestamp">,
  orderNumber: string
): string {
  return [
    "TIJARAH-ESIGN",
    signature.verificationCode,
    orderNumber,
    signature.signer,
    signature.signerName,
    signature.timestamp,
  ].join("|");
}

/**
 * Mengunduh elemen SVG (QR) sebagai file PNG.
 */
export function downloadSvgAsPng(svgElement: SVGSVGElement, fileName: string, size = 512): void {
  const serialized = new XMLSerializer().serializeToString(svgElement);
  const svgUrl = URL.createObjectURL(new Blob([serialized], { type: "image/svg+xml" }));
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(svgUrl);
      return;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    URL.revokeObjectURL(svgUrl);

    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  image.src = svgUrl;
}
