export interface DevTelemetryEntry {
  type: "API_ERROR" | "CONSOLE_ERROR" | "UNHANDLED_REJECTION";
  timestamp: string;
  method?: string;
  url?: string;
  status?: number;
  message: string;
}

const MAX_ENTRIES = 25;
const telemetryBuffer: DevTelemetryEntry[] = [];
let initialized = false;

function pushEntry(entry: DevTelemetryEntry) {
  const latest = telemetryBuffer[0];
  if (latest && latest.type === entry.type && latest.message === entry.message && latest.url === entry.url) {
    return; // Deduplicate consecutive identical errors
  }
  telemetryBuffer.unshift(entry);
  if (telemetryBuffer.length > MAX_ENTRIES) {
    telemetryBuffer.length = MAX_ENTRIES;
  }
}

export function recordApiTelemetry(entry: Omit<DevTelemetryEntry, "type" | "timestamp">) {
  if (process.env.NODE_ENV !== "development") return;
  if (entry.url && entry.url.includes("/dev-qa")) return;
  pushEntry({
    type: "API_ERROR",
    timestamp: new Date().toISOString(),
    ...entry,
  });
}

export function initDevTelemetryCapture() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development" || initialized) {
    return;
  }
  initialized = true;

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    try {
      const msg = args
        .map((a) => (typeof a === "string" ? a : a?.message || JSON.stringify(a)))
        .join(" ")
        .slice(0, 400);
      pushEntry({
        type: "CONSOLE_ERROR",
        timestamp: new Date().toISOString(),
        message: msg,
      });
    } catch {
      // ignore serialization errors
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener("error", (event) => {
    pushEntry({
      type: "CONSOLE_ERROR",
      timestamp: new Date().toISOString(),
      message: event.message || "Window runtime error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    pushEntry({
      type: "UNHANDLED_REJECTION",
      timestamp: new Date().toISOString(),
      message: reason?.message || String(reason || "Unhandled promise rejection"),
    });
  });
}

export function getDevTelemetrySnapshot(user?: Record<string, any> | null) {
  if (typeof window === "undefined") return null;
  return {
    capturedAt: new Date().toISOString(),
    url: window.location.pathname + window.location.search,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    user: user
      ? {
          id: user.id,
          email: user.email,
          userType: user.userType,
          roles: user.roles || [],
        }
      : null,
    recentErrors: telemetryBuffer.slice(0, 10),
  };
}

// ── Playwright In-Browser Flow & API Hit Recorder ─────────────────────────────
export interface RecordedStep {
  type: "goto" | "click" | "fill" | "select";
  locator: string;
  label: string;
  value?: string;
  url: string;
  timestamp: string;
}

export interface RecordedApiHit {
  method: string;
  url: string;
  status: number;
  message?: string;
  timestamp: string;
}

let isRecording = false;
let recordingStartUrl = "";
let recordedSteps: RecordedStep[] = [];
let recordedApiHits: RecordedApiHit[] = [];
let listenersAttached = false;
const recordingListeners = new Set<() => void>();

function notifyRecordingChange() {
  recordingListeners.forEach((cb) => cb());
}

export function subscribeRecording(cb: () => void): () => void {
  recordingListeners.add(cb);
  return () => {
    recordingListeners.delete(cb);
  };
}

function escapeQuote(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function computePlaywrightLocator(el: HTMLElement): { locator: string; label: string } {
  const testId = el.getAttribute("data-testid");
  if (testId) {
    return { locator: `page.getByTestId('${escapeQuote(testId)}')`, label: `[data-testid="${testId}"]` };
  }

  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute("id");
  if (id && !id.startsWith(":r")) {
    return { locator: `page.locator('#${escapeQuote(id)}')`, label: `#${id}` };
  }

  const ariaLabel = el.getAttribute("aria-label")?.trim();
  const placeholder = el.getAttribute("placeholder")?.trim();
  const nameAttr = el.getAttribute("name")?.trim();

  if ((tag === "button" || el.getAttribute("role") === "button") && (ariaLabel || el.innerText?.trim())) {
    const btnText = (ariaLabel || el.innerText.trim().split("\n")[0]).slice(0, 40);
    return {
      locator: `page.getByRole('button', { name: '${escapeQuote(btnText)}' }).first()`,
      label: `Button "${btnText}"`,
    };
  }

  if (tag === "a" && (ariaLabel || el.innerText?.trim())) {
    const linkText = (ariaLabel || el.innerText.trim().split("\n")[0]).slice(0, 40);
    return {
      locator: `page.getByRole('link', { name: '${escapeQuote(linkText)}' }).first()`,
      label: `Link "${linkText}"`,
    };
  }

  if ((tag === "input" || tag === "textarea" || tag === "select") && placeholder) {
    return {
      locator: `page.getByPlaceholder('${escapeQuote(placeholder)}').first()`,
      label: `${tag} "${placeholder}"`,
    };
  }

  if (nameAttr) {
    return {
      locator: `page.locator('${tag}[name="${escapeQuote(nameAttr)}"]').first()`,
      label: `${tag}[name="${nameAttr}"]`,
    };
  }

  const textSnippet = el.innerText?.trim().split("\n")[0]?.slice(0, 35);
  if (textSnippet) {
    return {
      locator: `page.getByText('${escapeQuote(textSnippet)}').first()`,
      label: `"${textSnippet}"`,
    };
  }

  return { locator: `page.locator('${tag}').first()`, label: tag };
}

function attachDomRecorderListeners() {
  if (typeof window === "undefined" || listenersAttached) return;
  listenersAttached = true;

  document.addEventListener(
    "click",
    (event) => {
      if (!isRecording) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[data-dev-qa-dock='true']")) return;

      const interactive =
        (target.closest("button, a, [role='button'], input[type='checkbox'], input[type='radio']") as HTMLElement) ||
        target;
      const { locator, label } = computePlaywrightLocator(interactive);
      const currentUrl = window.location.pathname + window.location.search;

      recordedSteps.push({
        type: "click",
        locator,
        label,
        url: currentUrl,
        timestamp: new Date().toISOString(),
      });
      notifyRecordingChange();
    },
    true
  );

  document.addEventListener(
    "change",
    (event) => {
      if (!isRecording) return;
      const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (!target || target.closest("[data-dev-qa-dock='true']")) return;

      const tag = target.tagName.toLowerCase();
      if (tag === "input" && ((target as HTMLInputElement).type === "checkbox" || (target as HTMLInputElement).type === "radio")) {
        return; // already captured by click
      }

      const { locator, label } = computePlaywrightLocator(target);
      const isPassword = tag === "input" && (target as HTMLInputElement).type === "password";
      const val = isPassword ? "***" : String(target.value || "").slice(0, 120);

      recordedSteps.push({
        type: tag === "select" ? "select" : "fill",
        locator,
        label,
        value: val,
        url: window.location.pathname + window.location.search,
        timestamp: new Date().toISOString(),
      });
      notifyRecordingChange();
    },
    true
  );
}

export function startPlaywrightRecording() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  attachDomRecorderListeners();
  isRecording = true;
  recordingStartUrl = window.location.pathname + window.location.search;
  recordedSteps = [
    {
      type: "goto",
      locator: `page.goto('${recordingStartUrl}')`,
      label: `Buka halaman ${recordingStartUrl}`,
      url: recordingStartUrl,
      timestamp: new Date().toISOString(),
    },
  ];
  recordedApiHits = [];
  notifyRecordingChange();
}

export function stopPlaywrightRecording() {
  isRecording = false;
  notifyRecordingChange();
  return getRecordingSnapshot();
}

export function recordPlaywrightApiHit(hit: Omit<RecordedApiHit, "timestamp">) {
  if (!isRecording || process.env.NODE_ENV !== "development") return;
  if (hit.url.includes("/dev-qa")) return;
  recordedApiHits.push({
    ...hit,
    timestamp: new Date().toISOString(),
  });
  notifyRecordingChange();
}

export function buildPlaywrightSpec(
  testName: string,
  startUrl: string,
  steps: RecordedStep[]
): string {
  const safeName = escapeQuote(testName || "Recorded QA Flow");
  const lines: string[] = [
    `import { test, expect } from '@playwright/test';`,
    ``,
    `test('${safeName}', async ({ page }) => {`,
    `  await page.goto('${escapeQuote(startUrl || "/id")}');`,
  ];

  for (const s of steps) {
    if (s.type === "goto") continue;
    if (s.type === "click") {
      lines.push(`  await ${s.locator}.click();`);
    } else if (s.type === "fill") {
      lines.push(`  await ${s.locator}.fill('${escapeQuote(s.value || "")}');`);
    } else if (s.type === "select") {
      lines.push(`  await ${s.locator}.selectOption('${escapeQuote(s.value || "")}');`);
    }
  }

  lines.push(`});`);
  return lines.join("\n");
}

export function getRecordingSnapshot() {
  return {
    isRecording,
    startUrl: recordingStartUrl,
    steps: [...recordedSteps],
    apiHits: [...recordedApiHits],
    playwrightSpec: buildPlaywrightSpec("Tijarah QA Recorded Flow", recordingStartUrl, recordedSteps),
  };
}
