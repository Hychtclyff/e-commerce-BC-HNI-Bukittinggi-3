"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bug,
  X,
  Plus,
  Copy,
  Check,
  Trash2,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Square,
  Play,
  FileCode2,
} from "lucide-react";
import apiClient from "@/lib/axios/client";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import {
  initDevTelemetryCapture,
  getDevTelemetrySnapshot,
  startPlaywrightRecording,
  stopPlaywrightRecording,
  getRecordingSnapshot,
  subscribeRecording,
  RecordedStep,
  RecordedApiHit,
} from "@/lib/dev/qaTelemetry";
import { showToast } from "@/utils/toast";

interface DevTestSchema {
  id: string;
  code: string;
  module: string;
  title: string;
  endpoint?: string | null;
  expectedResult?: string | null;
  status: "UNTESTED" | "PASS" | "FAIL";
  isNewRequest?: boolean;
}

interface DevBugNote {
  id: string;
  schemaId?: string | null;
  schemaCode?: string | null;
  schemaTitle?: string | null;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "NEED_RETEST" | "HAS_EXTRA_ERROR" | "FIXED";
  noteType: "BUG" | "SCHEMA_REQUEST";
  currentUrl?: string | null;
  stepsOrNote: string;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  verificationStatus?: string;
  verificationNote?: string | null;
  rootCause?: string | null;
  solution?: string | null;
  parentBugId?: string | null;
  errorFlow?: string | null;
  logs?: any;
  createdAt: string;
}

function buildPromptForBug(bug: DevBugNote): string {
  const lines = [
    `### [${bug.noteType === "SCHEMA_REQUEST" ? "PERMINTAAN SKEMA BARU" : `BUG ${bug.severity}`}] ${bug.title}`,
    `- **ID Catatan:** ${bug.id}`,
    bug.parentBugId ? `- **Follow-up dari Bug:** ${bug.parentBugId}` : null,
    bug.schemaCode ? `- **Skema Gagal / Terkait:** [${bug.schemaCode}] ${bug.schemaTitle || ""}` : null,
    bug.currentUrl ? `- **Halaman / URL:** \`${bug.currentUrl}\`` : null,
    `- **Catatan / Langkah:** ${bug.stepsOrNote}`,
    bug.errorFlow ? `- **Flow Saat Error Tambahan:** ${bug.errorFlow}` : null,
    bug.expectedBehavior ? `- **Seharusnya (Expected):** ${bug.expectedBehavior}` : null,
    bug.actualBehavior ? `- **Aktual (Actual):** ${bug.actualBehavior}` : null,
    bug.rootCause ? `- **Penyebab (Root Cause):** ${bug.rootCause}` : null,
    bug.solution ? `- **Solusi:** ${bug.solution}` : null,
  ].filter(Boolean) as string[];

  if (bug.logs?.user) {
    lines.push(
      `- **User Aktif:** ${bug.logs.user.email || "-"} (type: ${bug.logs.user.userType || "-"}, roles: ${(bug.logs.user.roles || []).join(", ") || "-"})`
    );
  }
  const errors = Array.isArray(bug.logs?.recentErrors) ? bug.logs.recentErrors : [];
  if (errors.length > 0) {
    lines.push("- **Log Error Otomatis (API / Console):**");
    for (const err of errors.slice(0, 5)) {
      lines.push(`  - [${err.type}] ${err.method ? `${err.method} ${err.url} -> ${err.status || ""} ` : ""}${err.message}`);
    }
  }

  const recSteps: RecordedStep[] = Array.isArray(bug.logs?.recordedSteps) ? bug.logs.recordedSteps : [];
  if (recSteps.length > 0) {
    lines.push("- **Flow UI Terekam (Playwright Steps):**");
    recSteps.forEach((s, idx) => {
      lines.push(`  ${idx + 1}. [${s.type.toUpperCase()}] ${s.label}${s.value !== undefined ? ` = "${s.value}"` : ""} (\`${s.locator}\`)`);
    });
  }

  const apiHits: RecordedApiHit[] = Array.isArray(bug.logs?.recordedApiHits) ? bug.logs.recordedApiHits : [];
  if (apiHits.length > 0) {
    lines.push("- **Jejak Hit Endpoint API Saat Pengujian:**");
    apiHits.forEach((h) => {
      lines.push(`  - \`${h.method} ${h.url}\` -> **${h.status}**${h.message ? ` (${h.message})` : ""}`);
    });
  }

  return lines.join("\n");
}

export function DevBugTrackerDock() {
  if (process.env.NODE_ENV !== "development") return null;

  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"report" | "bugs" | "schemas" | "recorder">("report");

  const [schemas, setSchemas] = useState<DevTestSchema[]>([]);
  const [bugs, setBugs] = useState<DevBugNote[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Playwright Recording State
  const [recSnapshot, setRecSnapshot] = useState(() => getRecordingSnapshot());
  const [attachRecordingToBug, setAttachRecordingToBug] = useState(true);
  const [recordingName, setRecordingName] = useState("");
  const [savingRecording, setSavingRecording] = useState(false);

  // Report Bug / New Request Form
  const [noteType, setNoteType] = useState<"BUG" | "SCHEMA_REQUEST">("BUG");
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>("");
  const [bugTitle, setBugTitle] = useState("");
  const [severity, setSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [stepsOrNote, setStepsOrNote] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);

  // Bug Filter
  const [bugFilter, setBugFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "NEED_RETEST" | "HAS_EXTRA_ERROR" | "FIXED">("OPEN");

  // Schema CRUD Form
  const [editingSchemaId, setEditingSchemaId] = useState<string | null>(null);
  const [schemaCode, setSchemaCode] = useState("");
  const [schemaModule, setSchemaModule] = useState("Storefront");
  const [schemaTitle, setSchemaTitle] = useState("");
  const [schemaEndpoint, setSchemaEndpoint] = useState("");
  const [schemaExpected, setSchemaExpected] = useState("");
  const [schemaIsNewReq, setSchemaIsNewReq] = useState(false);

  useEffect(() => {
    initDevTelemetryCapture();
    return subscribeRecording(() => {
      setRecSnapshot(getRecordingSnapshot());
    });
  }, []);

  const loadQaData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, bRes, rRes] = await Promise.all([
        apiClient.get("/dev-qa/schemas", { skipAuthRedirect: true, skipGlobalToast: true } as any),
        apiClient.get("/dev-qa/bugs", { skipAuthRedirect: true, skipGlobalToast: true } as any),
        apiClient.get("/dev-qa/recordings", { skipAuthRedirect: true, skipGlobalToast: true } as any),
      ]);
      setSchemas(sRes.data?.data ?? []);
      setBugs(bRes.data?.data ?? []);
      setRecordings(rRes.data?.data ?? []);
    } catch {
      // Fallback silent when backend is offline
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleRecording = () => {
    if (recSnapshot.isRecording) {
      const snap = stopPlaywrightRecording();
      setRecSnapshot(snap);
      setIsOpen(true);
      setTab("recorder");
      showToast.info("Rekaman Selesai", `${snap.steps.length} langkah & ${snap.apiHits.length} hit API terekam.`);
    } else {
      startPlaywrightRecording();
      setIsOpen(false);
      showToast.info("Playwright Recorder Aktif", "Silakan lakukan flow pengujian. Klik tombol Stop di pojok kanan bawah jika selesai.");
    }
  };

  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingName.trim() || recSnapshot.steps.length === 0) return;
    setSavingRecording(true);
    try {
      await apiClient.post("/dev-qa/recordings", {
        name: recordingName.trim(),
        schemaId: selectedSchemaId || undefined,
        startUrl: recSnapshot.startUrl,
        steps: recSnapshot.steps,
        apiHits: recSnapshot.apiHits,
        playwrightSpec: recSnapshot.playwrightSpec,
      });
      setRecordingName("");
      showToast.success("Flow Tersimpan", "Script Playwright tersimpan ke database.");
      await loadQaData();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Gagal menyimpan rekaman.");
    } finally {
      setSavingRecording(false);
    }
  };

  const handleDeleteRecording = async (id: string) => {
    try {
      await apiClient.delete(`/dev-qa/recordings/${id}`);
      await loadQaData();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadQaData();
  }, [loadQaData]);

  const openBugsCount = useMemo(
    () => bugs.filter((b) => b.status === "OPEN").length,
    [bugs]
  );

  const telemetryPreview = useMemo(
    () => (isOpen ? getDevTelemetrySnapshot(user) : null),
    [isOpen, user]
  );

  const handleSelectSchema = (id: string) => {
    setSelectedSchemaId(id);
    const found = schemas.find((s) => s.id === id);
    if (found && !expectedBehavior) {
      setExpectedBehavior(found.expectedResult || "");
    }
  };

  const handleCopyText = async (text: string, labelId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(labelId);
      setTimeout(() => setCopiedId(null), 1800);
      showToast.success("Prompt Disalin", "Siap ditempel ke AI Assistant untuk perbaikan.");
    } catch {
      showToast.error("Gagal Menyalin", "Browser memblokir akses clipboard.");
    }
  };

  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !stepsOrNote.trim()) return;
    setSubmittingBug(true);
    try {
      const snapshot = getDevTelemetrySnapshot(user);
      const enrichedLogs = {
        ...snapshot,
        ...(attachRecordingToBug && recSnapshot.steps.length > 0
          ? {
              recordedSteps: recSnapshot.steps,
              recordedApiHits: recSnapshot.apiHits,
              playwrightSpec: recSnapshot.playwrightSpec,
            }
          : {}),
      };
      const res = await apiClient.post(
        "/dev-qa/bugs",
        {
          schemaId: selectedSchemaId || undefined,
          title: bugTitle.trim(),
          severity,
          noteType,
          currentUrl: snapshot?.url || window.location.pathname,
          stepsOrNote: stepsOrNote.trim(),
          expectedBehavior: expectedBehavior.trim() || undefined,
          actualBehavior: actualBehavior.trim() || undefined,
          logs: enrichedLogs,
        },
        { skipAuthRedirect: true } as any
      );
      const created = res.data?.data;
      setBugTitle("");
      setStepsOrNote("");
      setExpectedBehavior("");
      setActualBehavior("");
      showToast.success("Catatan Tersimpan", "Bug & log otomatis berhasil direkam.");
      await loadQaData();
      if (created) setTab("bugs");
    } catch (err: any) {
      showToast.error("Gagal Menyimpan", err?.message || "Pastikan backend dev berjalan.");
    } finally {
      setSubmittingBug(false);
    }
  };

  const handleSaveSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemaTitle.trim() || !schemaModule.trim()) return;
    try {
      if (editingSchemaId) {
        await apiClient.put(`/dev-qa/schemas/${editingSchemaId}`, {
          code: schemaCode.trim(),
          module: schemaModule.trim(),
          title: schemaTitle.trim(),
          endpoint: schemaEndpoint.trim() || undefined,
          expectedResult: schemaExpected.trim() || undefined,
          isNewRequest: schemaIsNewReq,
        });
        showToast.success("Skema Diperbarui", schemaTitle);
      } else {
        await apiClient.post("/dev-qa/schemas", {
          code: schemaCode.trim() || undefined,
          module: schemaModule.trim(),
          title: schemaTitle.trim(),
          endpoint: schemaEndpoint.trim() || undefined,
          expectedResult: schemaExpected.trim() || undefined,
          isNewRequest: schemaIsNewReq,
        });
        showToast.success("Skema Ditambahkan", schemaTitle);
      }
      setEditingSchemaId(null);
      setSchemaCode("");
      setSchemaTitle("");
      setSchemaEndpoint("");
      setSchemaExpected("");
      setSchemaIsNewReq(false);
      await loadQaData();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Gagal menyimpan skema.");
    }
  };

  const [extraErrorDrafts, setExtraErrorDrafts] = useState<Record<string, { flow: string; title: string }>>({});

  const handleUpdateBugStatus = async (
    id: string,
    status: "OPEN" | "IN_PROGRESS" | "NEED_RETEST" | "HAS_EXTRA_ERROR" | "FIXED",
    verificationNote?: string,
    errorFlow?: string
  ) => {
    try {
      await apiClient.patch(`/dev-qa/bugs/${id}`, {
        status,
        ...(verificationNote !== undefined ? { verificationNote } : {}),
        ...(errorFlow !== undefined ? { errorFlow } : {}),
      });
      await loadQaData();
    } catch {
      // ignore
    }
  };

  const handleCreateFollowUpBug = async (parentBug: DevBugNote) => {
    const draft = extraErrorDrafts[parentBug.id] || { flow: parentBug.errorFlow || "", title: "" };
    const flowText = draft.flow.trim();
    const followUpTitle = draft.title.trim() || `Follow-up ${parentBug.title}`;
    if (!flowText) {
      showToast.error("Flow Error Wajib Diisi", "Tuliskan flow atau langkah saat error tambahan muncul.");
      return;
    }
    try {
      const snapshot = getDevTelemetrySnapshot(user);
      await apiClient.post(
        "/dev-qa/bugs",
        {
          schemaId: parentBug.schemaId || undefined,
          parentBugId: parentBug.id,
          errorFlow: flowText,
          title: followUpTitle,
          severity: parentBug.severity,
          noteType: "BUG",
          currentUrl: snapshot?.url || window.location.pathname,
          stepsOrNote: `[Follow-up dari ${parentBug.id}] Flow error tambahan: ${flowText}`,
          logs: snapshot,
        },
        { skipAuthRedirect: true } as any
      );
      await apiClient.patch(`/dev-qa/bugs/${parentBug.id}`, {
        status: "HAS_EXTRA_ERROR",
        errorFlow: flowText,
      });
      setExtraErrorDrafts((prev) => {
        const next = { ...prev };
        delete next[parentBug.id];
        return next;
      });
      showToast.success("Follow-up Error Ditambahkan", `Bug lanjutan berhasil ditautkan ke ${parentBug.id}.`);
      await loadQaData();
    } catch (err: any) {
      showToast.error("Gagal Menambah Follow-up", err?.message || "Terjadi kesalahan.");
    }
  };

  const handleDeleteBug = async (id: string) => {
    try {
      await apiClient.delete(`/dev-qa/bugs/${id}`);
      await loadQaData();
    } catch {
      // ignore
    }
  };

  const handleUpdateSchemaStatus = async (id: string, status: "UNTESTED" | "PASS" | "FAIL") => {
    try {
      await apiClient.put(`/dev-qa/schemas/${id}`, { status });
      await loadQaData();
    } catch {
      // ignore
    }
  };

  const handleDeleteSchema = async (id: string) => {
    try {
      await apiClient.delete(`/dev-qa/schemas/${id}`);
      await loadQaData();
    } catch {
      // ignore
    }
  };

  const filteredBugs = bugs.filter((b) => (bugFilter === "ALL" ? true : b.status === bugFilter));

  const copyAllOpenBugsPrompt = () => {
    const openList = bugs.filter((b) => b.status === "OPEN");
    if (openList.length === 0) {
      showToast.info("Tidak Ada Bug OPEN", "Semua bug sudah ditandai FIXED.");
      return;
    }
    const header = `Tolong perbaiki daftar bug / permintaan skema berikut pada Tijarah:\n\n`;
    const body = openList.map((b, i) => `${i + 1}. ${buildPromptForBug(b)}`).join("\n\n---\n\n");
    void handleCopyText(header + body, "ALL_OPEN");
  };

  return (
    <>
      {/* Floating Dev Toolbar (Sudut Kanan Bawah) */}
      <div
        data-dev-qa-dock="true"
        className="fixed bottom-5 right-5 z-[9990] flex items-center gap-2 print:hidden"
      >
        <button
          type="button"
          onClick={handleToggleRecording}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full shadow-lg border text-xs font-bold transition-all cursor-pointer ${
            recSnapshot.isRecording
              ? "bg-rose-600 text-white border-rose-500"
              : "bg-surface text-text-primary border-border-subtle hover:bg-canvas"
          }`}
          title={recSnapshot.isRecording ? "Stop Playwright Recorder" : "Mulai Record Flow Pengujian (Playwright)"}
        >
          {recSnapshot.isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop ({recSnapshot.steps.length})</span>
            </>
          ) : (
            <>
              <CircleDot className="w-3.5 h-3.5 text-rose-500" />
              <span>Record</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            loadQaData();
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-text-primary text-surface shadow-lg border border-border-subtle hover:opacity-95 transition-all cursor-pointer"
          title="Dev QA & Catat Bug (Hanya tampil di mode development)"
        >
          <Bug className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">QA / Catat Bug</span>
          {openBugsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
              {openBugsCount}
            </span>
          )}
        </button>
      </div>

      {/* Dev QA Drawer Modal */}
      {isOpen && (
        <div
          data-dev-qa-dock="true"
          className="fixed inset-0 z-[9995] flex items-end sm:items-center justify-end sm:p-4 bg-black/50 print:hidden"
        >
          <div className="w-full sm:max-w-2xl h-[88vh] rounded-t-2xl sm:rounded-2xl border border-border-subtle bg-surface shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 bg-canvas border-b border-border-subtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Dev QA, Skema & Catat Bug</h3>
                  <p className="text-[11px] text-text-muted">
                    Mode Development • Auto-capture log API & console untuk prompt AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface cursor-pointer"
                aria-label="Tutup QA panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-3 pb-2 border-b border-border-subtle flex flex-wrap items-center gap-1.5 bg-surface">
              {[
                { id: "report", label: "Catat Bug", icon: Plus },
                { id: "recorder", label: `Recorder (${recSnapshot.steps.length})`, icon: FileCode2 },
                { id: "bugs", label: `Daftar Bug (${openBugsCount})`, icon: AlertTriangle },
                { id: "schemas", label: `Skema (${schemas.length})`, icon: ClipboardList },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      tab === t.id
                        ? "bg-primary-sage text-white"
                        : "bg-canvas text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {tab === "report" && (
                <form onSubmit={handleSubmitBug} className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNoteType("BUG")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        noteType === "BUG"
                          ? "border-rose-500 bg-rose-500/10 text-rose-600"
                          : "border-border-subtle bg-canvas text-text-muted"
                      }`}
                    >
                      Laporkan Bug
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteType("SCHEMA_REQUEST")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        noteType === "SCHEMA_REQUEST"
                          ? "border-primary-sage bg-primary-sage/10 text-primary-sage"
                          : "border-border-subtle bg-canvas text-text-muted"
                      }`}
                    >
                      Permintaan Skema / Fitur Baru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-text-muted">
                        Pilih Skema yang Gagal / Terkait
                      </label>
                      <select
                        value={selectedSchemaId}
                        onChange={(e) => handleSelectSchema(e.target.value)}
                        className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
                      >
                        <option value="">-- Pilih Skema (Opsional / Umum) --</option>
                        {schemas.map((s) => (
                          <option key={s.id} value={s.id}>
                            [{s.code}] {s.module} — {s.title} ({s.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-text-muted">Severity</label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as any)}
                        className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-muted">Judul Singkat *</label>
                    <input
                      type="text"
                      required
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      placeholder={
                        noteType === "BUG"
                          ? "Contoh: Tombol Simpan PO di Purchasing error 500"
                          : "Contoh: Tambah skema export laporan PDF bulanan"
                      }
                      className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-muted">
                      Catatan / Langkah Reproduksi *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={stepsOrNote}
                      onChange={(e) => setStepsOrNote(e.target.value)}
                      placeholder="Jelaskan langkah yang dilakukan atau detail permintaan..."
                      className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-text-muted">
                        Seharusnya (Expected)
                      </label>
                      <input
                        type="text"
                        value={expectedBehavior}
                        onChange={(e) => setExpectedBehavior(e.target.value)}
                        placeholder="Hasil yang diharapkan..."
                        className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-text-muted">
                        Aktual (Actual)
                      </label>
                      <input
                        type="text"
                        value={actualBehavior}
                        onChange={(e) => setActualBehavior(e.target.value)}
                        placeholder="Yang terjadi di layar..."
                        className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
                      />
                    </div>
                  </div>

                  {/* Auto-captured Telemetry Preview */}
                  {telemetryPreview && (
                    <div className="rounded-xl border border-border-subtle bg-canvas p-3 space-y-1.5 text-[11px]">
                      <div className="font-bold text-text-primary flex items-center justify-between">
                        <span>Log & Konteks Otomatis Terlampir</span>
                        <span className="font-mono text-text-muted">
                          {telemetryPreview.recentErrors.length} error terekam
                        </span>
                      </div>
                      <p className="font-mono text-text-muted truncate">
                        URL: {telemetryPreview.url} • User: {telemetryPreview.user?.email || "Guest"}
                      </p>
                      {telemetryPreview.recentErrors.slice(0, 3).map((err, i) => (
                        <p key={i} className="font-mono text-rose-600 truncate">
                          • [{err.type}] {err.method ? `${err.method} ${err.url} (${err.status}) ` : ""}
                          {err.message}
                        </p>
                      ))}
                      {recSnapshot.steps.length > 0 && (
                        <label className="flex items-center gap-2 pt-1.5 border-t border-border-subtle text-text-primary font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attachRecordingToBug}
                            onChange={(e) => setAttachRecordingToBug(e.target.checked)}
                            className="accent-primary-sage"
                          />
                          <span>
                            Lampirkan rekaman Playwright ({recSnapshot.steps.length} langkah UI &{" "}
                            {recSnapshot.apiHits.length} hit API)
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingBug}
                    className="w-full py-2.5 rounded-xl bg-primary-sage text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingBug ? "Menyimpan..." : "Simpan Catatan & Lampirkan Log"}
                  </button>
                </form>
              )}

              {tab === "recorder" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border-subtle bg-canvas p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        {recSnapshot.isRecording
                          ? "Sedang Merekam Flow UI & Hit API..."
                          : "Playwright Flow & API Recorder"}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        Rekam klik menu, form, konfirmasi delete, serta seluruh endpoint API yang terpanggil.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleRecording}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        recSnapshot.isRecording
                          ? "bg-rose-600 text-white"
                          : "bg-primary-sage text-white"
                      }`}
                    >
                      {recSnapshot.isRecording ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-white" /> Stop Record
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" /> Mulai Record Baru
                        </>
                      )}
                    </button>
                  </div>

                  {recSnapshot.steps.length > 0 && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-border-subtle bg-canvas p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-text-primary">
                            Langkah UI Terekam ({recSnapshot.steps.length})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(recSnapshot.playwrightSpec, "REC_SPEC")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-[11px] font-bold text-primary-sage cursor-pointer"
                            >
                              {copiedId === "REC_SPEC" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>Copy .spec.ts</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachRecordingToBug(true);
                                setTab("report");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Lampirkan ke Bug
                            </button>
                          </div>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono">
                          {recSnapshot.steps.map((s, idx) => (
                            <div key={idx} className="text-text-primary truncate">
                              {idx + 1}. [{s.type.toUpperCase()}] {s.label}
                              {s.value !== undefined ? ` = "${s.value}"` : ""}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border-subtle bg-canvas p-3 space-y-1.5">
                        <p className="text-xs font-bold text-text-primary">
                          Jejak Hit Endpoint API ({recSnapshot.apiHits.length})
                        </p>
                        {recSnapshot.apiHits.length === 0 ? (
                          <p className="text-[11px] text-text-muted">Belum ada request API selama rekaman.</p>
                        ) : (
                          <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] font-mono">
                            {recSnapshot.apiHits.map((h, i) => (
                              <div
                                key={i}
                                className={h.status >= 400 || h.status === 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400"}
                              >
                                [{h.status}] {h.method} {h.url}
                                {h.message ? ` — ${h.message}` : ""}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleSaveRecording} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={recordingName}
                          onChange={(e) => setRecordingName(e.target.value)}
                          placeholder="Nama flow (mis: Delete Product ERP)..."
                          className="flex-1 rounded-lg border border-border-subtle bg-canvas px-3 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={savingRecording}
                          className="px-3 py-1.5 rounded-lg bg-text-primary text-surface text-xs font-bold cursor-pointer"
                        >
                          {savingRecording ? "Menyimpan..." : "Simpan Flow"}
                        </button>
                      </form>
                    </div>
                  )}

                  {recordings.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border-subtle">
                      <p className="text-xs font-bold text-text-primary">
                        Library Flow Tersimpan ({recordings.length})
                      </p>
                      {recordings.map((rec) => (
                        <div
                          key={rec.id}
                          className="rounded-xl border border-border-subtle bg-canvas p-3 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">{rec.name}</p>
                            <p className="text-[10px] font-mono text-text-muted">
                              {Array.isArray(rec.steps) ? rec.steps.length : 0} langkah •{" "}
                              {Array.isArray(rec.apiHits) ? rec.apiHits.length : 0} hit API
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyText(rec.playwrightSpec, rec.id)}
                              className="px-2 py-1 rounded-lg bg-surface border border-border-subtle text-[11px] font-bold text-primary-sage cursor-pointer"
                            >
                              {copiedId === rec.id ? "Disalin!" : "Copy .spec.ts"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecording(rec.id)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                              aria-label="Hapus rekaman"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "bugs" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(["ALL", "OPEN", "IN_PROGRESS", "NEED_RETEST", "HAS_EXTRA_ERROR", "FIXED"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setBugFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            bugFilter === st
                              ? "bg-text-primary text-surface"
                              : "bg-canvas text-text-muted"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={copyAllOpenBugsPrompt}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-sage text-white text-xs font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {copiedId === "ALL_OPEN" ? "Tersalin!" : "Copy Prompt Semua Bug OPEN"}
                      </span>
                    </button>
                  </div>

                  {filteredBugs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                      {loading ? "Memuat catatan bug..." : "Belum ada catatan bug pada filter ini."}
                    </div>
                  ) : (
                    filteredBugs.map((bug) => (
                      <div
                        key={bug.id}
                        className="rounded-xl border border-border-subtle bg-canvas p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface border border-border-subtle">
                                {bug.id}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600">
                                {bug.noteType === "SCHEMA_REQUEST" ? "NEW REQUEST" : bug.severity}
                              </span>
                              {bug.schemaCode && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700">
                                  Skema: {bug.schemaCode}
                                </span>
                              )}
                              {bug.parentBugId && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
                                  Follow-up: {bug.parentBugId}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-text-primary">{bug.title}</h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyText(buildPromptForBug(bug), bug.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-border-subtle text-[11px] font-bold text-primary-sage hover:bg-primary-sage hover:text-white cursor-pointer"
                            >
                              {copiedId === bug.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === bug.id ? "Disalin" : "Copy Prompt"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBug(bug.id)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                              aria-label="Hapus bug"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-text-muted">{bug.stepsOrNote}</p>
                        {bug.currentUrl && (
                          <p className="text-[10px] font-mono text-text-muted">URL: {bug.currentUrl}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {(["OPEN", "IN_PROGRESS", "NEED_RETEST", "HAS_EXTRA_ERROR", "FIXED"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateBugStatus(bug.id, st)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                bug.status === st
                                  ? st === "FIXED"
                                    ? "bg-emerald-600 text-white"
                                    : st === "HAS_EXTRA_ERROR"
                                      ? "bg-rose-600 text-white"
                                      : "bg-text-primary text-surface"
                                  : "bg-surface border border-border-subtle text-text-muted"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                        {bug.verificationNote && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                            Catatan Verifikasi: {bug.verificationNote}
                          </p>
                        )}
                        {bug.errorFlow && (
                          <p className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                            <strong>Flow Error Tambahan:</strong> {bug.errorFlow}
                          </p>
                        )}
                        {(bug.rootCause || bug.solution) && (
                          <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-2.5 py-2 space-y-1 text-[11px]">
                            {bug.rootCause && (
                              <p className="text-text-primary">
                                <strong className="text-amber-700 dark:text-amber-300">Penyebab:</strong> {bug.rootCause}
                              </p>
                            )}
                            {bug.solution && (
                              <p className="text-text-primary">
                                <strong className="text-emerald-700 dark:text-emerald-300">Solusi:</strong> {bug.solution}
                              </p>
                            )}
                          </div>
                        )}
                        {bug.status === "HAS_EXTRA_ERROR" && (
                          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 space-y-2">
                            <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                              Catat Flow Error Tambahan / Buat Follow-up Error
                            </p>
                            <input
                              type="text"
                              placeholder="Judul follow-up error (opsional)..."
                              value={extraErrorDrafts[bug.id]?.title ?? ""}
                              onChange={(e) =>
                                setExtraErrorDrafts((prev) => ({
                                  ...prev,
                                  [bug.id]: {
                                    flow: prev[bug.id]?.flow ?? bug.errorFlow ?? "",
                                    title: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-[11px]"
                            />
                            <textarea
                              rows={2}
                              placeholder="Jelaskan flow / langkah saat error tambahan ini terjadi..."
                              value={extraErrorDrafts[bug.id]?.flow ?? bug.errorFlow ?? ""}
                              onChange={(e) =>
                                setExtraErrorDrafts((prev) => ({
                                  ...prev,
                                  [bug.id]: {
                                    flow: e.target.value,
                                    title: prev[bug.id]?.title ?? "",
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-[11px]"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateBugStatus(
                                    bug.id,
                                    "HAS_EXTRA_ERROR",
                                    undefined,
                                    extraErrorDrafts[bug.id]?.flow ?? bug.errorFlow ?? ""
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg border border-border-subtle bg-surface text-[11px] font-bold cursor-pointer"
                              >
                                Simpan Flow
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreateFollowUpBug(bug)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                + Buat Follow-up Error
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "schemas" && (
                <div className="space-y-4">
                  <form
                    onSubmit={handleSaveSchema}
                    className="rounded-xl border border-border-subtle bg-canvas p-3.5 space-y-2.5"
                  >
                    <h4 className="text-xs font-bold text-text-primary">
                      {editingSchemaId ? "Edit Skema Pengujian" : "Tambah Skema / Permintaan Baru"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Kode (mis: ERP-23)"
                        value={schemaCode}
                        onChange={(e) => setSchemaCode(e.target.value)}
                        className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Modul (mis: ERP Kasir)"
                        value={schemaModule}
                        onChange={(e) => setSchemaModule(e.target.value)}
                        className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Endpoint (opsional)"
                        value={schemaEndpoint}
                        onChange={(e) => setSchemaEndpoint(e.target.value)}
                        className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Judul Skema Pengujian *"
                      value={schemaTitle}
                      onChange={(e) => setSchemaTitle(e.target.value)}
                      className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Hasil yang Diharapkan (Expected Result)"
                      value={schemaExpected}
                      onChange={(e) => setSchemaExpected(e.target.value)}
                      className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schemaIsNewReq}
                          onChange={(e) => setSchemaIsNewReq(e.target.checked)}
                          className="accent-primary-sage"
                        />
                        <span>Tandai sebagai Permintaan Skema Baru</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {editingSchemaId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSchemaId(null);
                              setSchemaCode("");
                              setSchemaTitle("");
                              setSchemaEndpoint("");
                              setSchemaExpected("");
                            }}
                            className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-bold cursor-pointer"
                          >
                            Batal
                          </button>
                        )}
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-primary-sage text-white text-xs font-bold cursor-pointer"
                        >
                          {editingSchemaId ? "Simpan Perubahan" : "Tambah Skema"}
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {schemas.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-border-subtle bg-canvas p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface border border-border-subtle">
                              {s.code}
                            </span>
                            <span className="text-[11px] font-bold text-primary-sage">{s.module}</span>
                            {s.isNewRequest && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700">
                                Permintaan Baru
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-text-primary">{s.title}</p>
                          {s.expectedResult && (
                            <p className="text-[11px] text-text-muted">{s.expectedResult}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {(["UNTESTED", "PASS", "FAIL"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateSchemaStatus(s.id, st)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                s.status === st
                                  ? st === "PASS"
                                    ? "bg-emerald-600 text-white"
                                    : st === "FAIL"
                                      ? "bg-rose-600 text-white"
                                      : "bg-text-primary text-surface"
                                  : "bg-surface border border-border-subtle text-text-muted"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSchemaId(s.id);
                              setSchemaCode(s.code);
                              setSchemaModule(s.module);
                              setSchemaTitle(s.title);
                              setSchemaEndpoint(s.endpoint || "");
                              setSchemaExpected(s.expectedResult || "");
                              setSchemaIsNewReq(Boolean(s.isNewRequest));
                            }}
                            className="px-2 py-0.5 rounded bg-surface border border-border-subtle text-[10px] font-bold text-text-primary cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchema(s.id)}
                            className="p-1 rounded text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            aria-label="Hapus skema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
