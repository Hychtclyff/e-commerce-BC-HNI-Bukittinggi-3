"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Loader2,
  Check,
  UserCheck,
  X,
  Phone,
  User,
  ShieldAlert,
  Hash,
  CreditCard,
  MapPin,
  Sparkles,
  ChevronDown
} from "lucide-react";
import clsx from "clsx";
import profileApi from "@/modules/profile/api/profile.api";
import { SearchedHniMember, HniSearchType } from "@/modules/profile/types/profile.types";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahSelect } from "@/components/atom/tijarahSelect";

export interface SearchHniProfileSearchProps {
  onSelectMember?: (member: SearchedHniMember | null) => void;
  selectedMemberId?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  canEdit?: boolean;
}

/**
 * Normalisasi data agen dari respons HSIS / backend Tijarah:
 * - ID Search payload { code: "01093705", jual: "MLM" }:
 *   ci: Customer ID ("01093705")
 *   cn: Customer Name ("NOVI ERNI LINDA NOFITA")
 *   addr: Alamat ("BUKITTINGGI SUMATERA BARAT")
 *   ds: Direct Status ("DED")
 *   ts: Title Status ("PA")
 *   dsts: Combined Status ("DED - PA")
 *   ia: Upline ID ("02862037")
 *   np: Upline Name / Agency ("BC HNI BUKITTINGGI 3")
 *   na: Level ("PA/PA")
 *   un: Agency Type ("bStk")
 *   t: Telepon ("")
 *
 * - Search by Name/NIK/Phone:
 *   ci, cn, ui, un, ds, ts, mp, ic
 */
function normalizeMember(item: any): SearchedHniMember {
  const memberId = String(
    item.ci || item.hniMemberId || item.memberId || item.id || item.cust_id || item.no_id || item.c || ""
  ).trim();

  const memberName = String(
    item.cn || item.hniMemberName || item.memberName || item.name || item.cust_name || item.full_name || ""
  ).trim();

  const uplineId = item.ia || item.ui || item.uplineId || item.sponsor_id || undefined;
  // np adalah nama BC/Upline pada respons orderhm/customer, un adalah upline pada customer-search
  const uplineName = item.np || item.un || item.uplineName || item.sponsor_name || item.sponsorName || item.upline || undefined;

  const directStatus = item.ds || item.directStatus || undefined;
  const titleStatus = item.ts || item.titleStatus || item.rankMarketing || undefined;
  const rank =
    item.dsts ||
    (directStatus && titleStatus ? `${directStatus} - ${titleStatus}` : undefined) ||
    titleStatus ||
    directStatus ||
    item.rank ||
    undefined;

  const phoneNumber =
    item.t ||
    item.mp ||
    item.phoneNumber ||
    item.noHandphone ||
    item.mobilePhone ||
    item.phone ||
    undefined;

  const idCardNumber = item.ic || item.idCardNumber || undefined;
  const fullAddress = item.addr || item.fullAddress || item.address || item.alamat || undefined;

  return {
    hniMemberId: memberId,
    hniMemberName: memberName,
    uplineId: uplineId ? String(uplineId) : undefined,
    uplineName: uplineName ? String(uplineName) : undefined,
    directStatus: directStatus ? String(directStatus) : undefined,
    titleStatus: titleStatus ? String(titleStatus) : undefined,
    rank: rank ? String(rank) : undefined,
    rankMarketing: titleStatus ? String(titleStatus) : directStatus ? String(directStatus) : undefined,
    phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
    idCardNumber: idCardNumber ? String(idCardNumber) : undefined,
    fullAddress: fullAddress ? String(fullAddress) : undefined,
    city: item.city || item.kota || undefined,
    isVerified: true, // Data resmi langsung dari server HSIS HNI
    raw: item,
  };
}

/**
 * Ekstraksi array data anggota dari berbagai varian payload respons BE
 */
function extractMemberList(resData: any): SearchedHniMember[] {
  if (!resData) return [];

  let rawList: any[] = [];
  if (Array.isArray(resData)) {
    rawList = resData;
  } else if (Array.isArray(resData?.data?.rows)) {
    rawList = resData.data.rows;
  } else if (Array.isArray(resData?.data?.data?.rows)) {
    rawList = resData.data.data.rows;
  } else if (Array.isArray(resData?.rows)) {
    rawList = resData.rows;
  } else if (Array.isArray(resData?.data)) {
    rawList = resData.data;
  } else if (Array.isArray(resData?.items)) {
    rawList = resData.items;
  } else if (Array.isArray(resData?.list)) {
    rawList = resData.list;
  } else if (
    typeof resData === "object" &&
    (resData.ci || resData.cn || resData.id || resData.hniMemberId || resData.code)
  ) {
    rawList = [resData];
  }

  return rawList
    .map(normalizeMember)
    .filter((m) => m.hniMemberId.length > 0 || m.hniMemberName.length > 0);
}

export const SearchHniProfileSearch: React.FC<SearchHniProfileSearchProps> = ({
  onSelectMember,
  selectedMemberId,
  placeholder,
  label,
  disabled = false,
  className,
  canEdit = true,
}) => {
  const t = useTranslations("hniForm");
  const displayLabel = label ?? t("searchLabel");

  const [searchType, setSearchType] = useState<HniSearchType>("id");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedHniMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchedHniMember | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync dengan selectedMemberId eksternal jika ada
  useEffect(() => {
    if (!selectedMemberId) {
      setSelectedMember(null);
    }
  }, [selectedMemberId]);

  // Click outside listener untuk menutup dropdown hasil
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Placeholder dinamis berdasarkan opsi pencarian
  const getDynamicPlaceholder = (): string => {
    if (placeholder) return placeholder;
    switch (searchType) {
      case "id":
        return t("placeholderId");
      case "name":
        return t("placeholderName");
      case "nik":
        return t("placeholderNik");
      case "phone":
        return t("placeholderPhone");
      default:
        return t("searchPlaceholder");
    }
  };

  // Trigger search manual atau submit
  const triggerSearch = useCallback(
    async (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        setErrorMsg(
          searchType === "id"
            ? "Silakan masukkan nomor ID Agen HNI terlebih dahulu."
            : searchType === "name"
            ? "Silakan masukkan nama agen yang ingin dicari."
            : searchType === "nik"
            ? "Silakan masukkan NIK (KTP) agen yang ingin dicari."
            : "Silakan masukkan nomor HP agen yang ingin dicari."
        );
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);
      setResults([]);
      setIsOpen(true);

      try {
        if (searchType === "id") {
          // Panggil endpoint POST /api/v1/profile/search-hni-by-id dengan payload { code, jual: 'MLM' }
          const res = await profileApi.searchHniMemberById({
            code: trimmed,
            jual: "MLM",
          });

          const memberItem = res?.data ?? res;
          if (memberItem && (memberItem.ci || memberItem.cn || memberItem.hniMemberId)) {
            const normalized = normalizeMember(memberItem);
            setResults([normalized]);
          } else {
            setResults([]);
            setErrorMsg(`Member HNI dengan ID '${trimmed}' tidak ditemukan di sistem HSIS.`);
          }
        } else {
          // Panggil endpoint GET /api/v1/profile/searchHniProfile dengan searchType name, nik, atau phone
          const res = await profileApi.searchHniProfile({
            keyword: trimmed,
            noHandphone: searchType === "phone" ? trimmed : undefined,
            searchType,
            start: 0,
            limit: 20,
          });

          const list = extractMemberList(res);
          setResults(list);
          if (list.length === 0) {
            setErrorMsg(t("noAgentFoundDesc"));
          }
        }
        setIsOpen(true);
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Gagal mencari agen HNI di server HSIS. Silakan periksa kembali kata kunci.";
        setErrorMsg(message);
        setResults([]);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    [searchType, t]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedMember(null);
    setErrorMsg(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerSearch(query);
    }
  };

  const handleSelectMember = (member: SearchedHniMember) => {
    const verifiedMember = { ...member, isVerified: true };
    setSelectedMember(verifiedMember);
    setQuery(`${member.hniMemberName} (${member.hniMemberId})`);
    setIsOpen(false);
    if (onSelectMember) {
      onSelectMember(verifiedMember);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSelectedMember(null);
    setErrorMsg(null);
    setIsOpen(false);
    if (onSelectMember) {
      onSelectMember(null);
    }
  };

  const searchOptions: { key: HniSearchType; label: string; icon: React.ReactNode }[] = [
    { key: "id", label: t("searchTypeId"), icon: <Hash className="w-3.5 h-3.5" /> },
    { key: "name", label: t("searchTypeName"), icon: <User className="w-3.5 h-3.5" /> },
    { key: "nik", label: t("searchTypeNik"), icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: "phone", label: t("searchTypePhone"), icon: <Phone className="w-3.5 h-3.5" /> },
  ];

  return (
    <div ref={containerRef} className={clsx("relative w-full flex flex-col gap-2", className)}>
      {displayLabel && (
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary-sage" />
            <span>{displayLabel}</span>
          </label>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <Sparkles className="w-3 h-3" />
            <span>{t("searchAuto")}</span>
          </div>
        </div>
      )}

      {/* Select Dropdown & Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Select Pencarian Agent (Nama, NIK, NoHP, Nomor ID Agen) via TijarahSelect */}
        <div className="shrink-0 w-full sm:w-64">
          <TijarahSelect
            aria-label={t("searchTypeLabel")}
            selectedKey={searchType}
            onSelectionChange={(keys) => {
              let val = "";
              if (typeof keys === "string" || typeof keys === "number") {
                val = String(keys);
              } else if (keys && typeof keys === "object") {
                const first = Array.from(keys as any)[0];
                if (first) val = String(first);
              }
              if (val && (val === "id" || val === "name" || val === "nik" || val === "phone")) {
                setSearchType(val as HniSearchType);
                setResults([]);
                setErrorMsg(null);
              }
            }}
            isDisabled={disabled || isLoading || !canEdit}
            className="w-full font-bold shadow-xs"
            tijarahVariant="primary"
          >
            {searchOptions.map((opt) => (
              <TijarahSelect.Item id={opt.key} key={opt.key} textValue={opt.label}>
                <div className="flex items-center gap-2 py-0.5">
                  <span className="text-primary-sage">{opt.icon}</span>
                  <span className="font-bold text-xs sm:text-sm text-text-primary">{opt.label}</span>
                </div>
              </TijarahSelect.Item>
            ))}
          </TijarahSelect>
        </div>

        {/* Search Input Box */}
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-3.5 z-10 flex items-center justify-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading || !canEdit}
            placeholder={getDynamicPlaceholder()}
            className={clsx(
              "w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm border transition-all duration-200 outline-none font-medium",
              "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
              isOpen
                ? "border-primary-sage ring-2 ring-primary-sage/20"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary-sage",
              disabled && "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
            )}
          />

          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tombol Eksekusi Cari */}
        <TijarahButton
          type="button"
          onClick={() => triggerSearch(query)}
          isDisabled={disabled || isLoading || query.trim().length === 0 || !canEdit}
          isLoading={isLoading}
          className="shrink-0 !h-[42px] px-5 font-bold rounded-xl"
          startContent={!isLoading && <Search className="w-4 h-4" />}
        >
          {t("searchBtn")}
        </TijarahButton>
      </div>

      {/* Terpilih Badge / Feedback - Status Langsung Aktif (Non-Pending) */}
      {selectedMember && (
        <div className="mt-1 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-300 dark:border-emerald-700/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {selectedMember.hniMemberName}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {selectedMember.hniMemberId}
                </span>
                {selectedMember.rank && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {selectedMember.rank}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                  {t("directSystemBadge")} • Langsung Aktif
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                {selectedMember.uplineName && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Upline/BC: <strong className="text-slate-700 dark:text-slate-200">{selectedMember.uplineName}</strong></span>
                  </span>
                )}
                {selectedMember.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedMember.phoneNumber}</span>
                  </span>
                )}
                {selectedMember.fullAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-xs">{selectedMember.fullAddress}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 underline shrink-0 self-end sm:self-center"
          >
            {t("changeBtn")}
          </button>
        </div>
      )}

      {/* Dropdown Hasil Pencarian */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl py-1">
          {isLoading && results.length === 0 && (
            <div className="p-5 flex items-center justify-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin text-primary-sage" />
              <span>{t("searching")}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5 bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/40">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isLoading && results.length === 0 && !errorMsg && (
            <div className="p-5 text-center text-sm text-slate-500 dark:text-slate-400">
              <p className="font-bold text-slate-700 dark:text-slate-200">{t("noAgentFound")}</p>
              <p className="text-xs text-slate-400 mt-1">{t("noAgentFoundDesc")}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <div className="px-4 py-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <span>{t("searchResults")} ({results.length})</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Status Non-Pending (Langsung Aktif)</span>
              </div>
              {results.map((item, index) => {
                const isItemActive = selectedMember?.hniMemberId === item.hniMemberId;
                return (
                  <button
                    key={`${item.hniMemberId}-${index}`}
                    type="button"
                    onClick={() => handleSelectMember(item)}
                    className={clsx(
                      "w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-3",
                      "hover:bg-emerald-50/50 dark:hover:bg-slate-800/80 focus:bg-emerald-50/50 dark:focus:bg-slate-800/80 outline-none",
                      isItemActive && "bg-emerald-50 dark:bg-emerald-950/30"
                    )}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {item.hniMemberName || "Tanpa Nama"}
                        </span>
                        <TijarahBadge tijarahVariant="primary" className="text-[10px] font-mono px-2 py-0 font-bold">
                          {item.hniMemberId}
                        </TijarahBadge>
                        {item.rank && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                            {item.rank}
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Resmi HSIS
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.uplineName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>Upline/BC: {item.uplineName}</span>
                          </span>
                        )}
                        {item.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phoneNumber}</span>
                          </span>
                        )}
                        {item.fullAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-full sm:max-w-sm">{item.fullAddress}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {isItemActive && (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchHniProfileSearch;