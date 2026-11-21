import axios from "axios";

export interface ZoneRateRule {
  province?: string;
  city: string;
  district?: string;
  cost: number;
  estimatedTime?: string;
}

export interface ShippingQuote {
  methodId: string;
  code: string;
  name: string;
  type: string;
  verificationFlow: string;
  cost: number;
  estimatedTime: string;
  pricingSource: "PICKUP" | "ZONE_TABLE" | "PROVIDER_API" | "FLAT_FALLBACK";
  matchedZone?: string;
}

export interface ShippingRateRequest {
  province?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  totalWeightGrams?: number;
}

function matchZoneRate(
  zones: ZoneRateRule[],
  city?: string,
  province?: string,
  district?: string
): ZoneRateRule | null {
  if (!Array.isArray(zones) || zones.length === 0) return null;
  const targetCity = String(city || "").trim().toLowerCase();
  const targetProv = String(province || "").trim().toLowerCase();
  const targetDist = String(district || "").trim().toLowerCase();

  if (!targetCity && !targetProv && !targetDist) return null;

  // Priority 1: exact/partial district + city match
  if (targetDist) {
    const distMatch = zones.find(
      (z) =>
        z.district &&
        targetDist.includes(z.district.trim().toLowerCase()) &&
        (!z.city || targetCity.includes(z.city.trim().toLowerCase()))
    );
    if (distMatch) return distMatch;
  }

  // Priority 2: city match
  if (targetCity) {
    const cityMatch = zones.find(
      (z) =>
        z.city &&
        (targetCity.includes(z.city.trim().toLowerCase()) ||
          z.city.trim().toLowerCase().includes(targetCity))
    );
    if (cityMatch) return cityMatch;
  }

  // Priority 3: province fallback
  if (targetProv) {
    const provMatch = zones.find(
      (z) =>
        z.province &&
        !z.city &&
        targetProv.includes(z.province.trim().toLowerCase())
    );
    if (provMatch) return provMatch;
  }

  return null;
}

export const shippingRatesService = {
  async calculateDynamicRates(
    methods: any[],
    destination: ShippingRateRequest
  ): Promise<ShippingQuote[]> {
    const activeMethods = (methods || []).filter((m) => m.isActive);
    const weightGrams = Math.max(500, Number(destination.totalWeightGrams || 1000));
    const quotes: ShippingQuote[] = [];

    // Optional Biteship API integration if BITESHIP_API_KEY is configured
    const biteshipKey = process.env.BITESHIP_API_KEY;
    let biteshipRates: Array<{ courier_code: string; courier_name: string; price: number; duration: string }> = [];

    if (biteshipKey && destination.postalCode) {
      try {
        const res = await axios.post(
          "https://api.biteship.com/v1/rates/couriers",
          {
            origin_postal_code: Number(process.env.STORE_ORIGIN_POSTAL_CODE || 26111),
            destination_postal_code: Number(destination.postalCode),
            couriers: "jne,jnt,sicepat,pos",
            items: [{ name: "Tijarah Order", value: 100000, weight: weightGrams, quantity: 1 }],
          },
          {
            headers: { Authorization: biteshipKey },
            timeout: 4000,
          }
        );
        biteshipRates = res.data?.pricing || [];
      } catch {
        // Graceful fallback to zone/baseCost below
      }
    }

    for (const m of activeMethods) {
      if (m.type === "STORE_PICKUP") {
        quotes.push({
          methodId: m.id,
          code: m.code,
          name: m.name,
          type: m.type,
          verificationFlow: m.verificationFlow,
          cost: 0,
          estimatedTime: m.estimatedTime || "Instan",
          pricingSource: "PICKUP",
        });
        continue;
      }

      const pricingMode = String(m.pricingMode || "FLAT").toUpperCase();
      const zones: ZoneRateRule[] = Array.isArray(m.zoneRates) ? m.zoneRates : [];

      if (pricingMode === "PROVIDER_API" && biteshipRates.length > 0) {
        const providerMatch = m.providerCode
          ? biteshipRates.find(
              (br) => br.courier_code?.toLowerCase() === String(m.providerCode).toLowerCase()
            )
          : biteshipRates[0];
        if (providerMatch) {
          quotes.push({
            methodId: m.id,
            code: m.code,
            name: m.name,
            type: m.type,
            verificationFlow: m.verificationFlow,
            cost: Number(providerMatch.price) || Number(m.baseCost) || 0,
            estimatedTime: providerMatch.duration || m.estimatedTime || "2-4 Hari",
            pricingSource: "PROVIDER_API",
          });
          continue;
        }
      }

      if (pricingMode === "ZONE_TABLE" || zones.length > 0) {
        const matched = matchZoneRate(
          zones,
          destination.city,
          destination.province,
          destination.district
        );
        if (matched) {
          quotes.push({
            methodId: m.id,
            code: m.code,
            name: m.name,
            type: m.type,
            verificationFlow: m.verificationFlow,
            cost: Number(matched.cost) || 0,
            estimatedTime: matched.estimatedTime || m.estimatedTime || "1-3 Hari",
            pricingSource: "ZONE_TABLE",
            matchedZone: matched.district || matched.city || matched.province,
          });
          continue;
        }
      }

      // Weight-scaled fallback or flat baseCost
      const baseCost = Number(m.baseCost) || 0;
      const weightKg = Math.ceil(weightGrams / 1000);
      const scaledCost = pricingMode === "PROVIDER_API" && baseCost > 0 ? baseCost * weightKg : baseCost;

      quotes.push({
        methodId: m.id,
        code: m.code,
        name: m.name,
        type: m.type,
        verificationFlow: m.verificationFlow,
        cost: scaledCost,
        estimatedTime: m.estimatedTime || "2-4 Hari",
        pricingSource: "FLAT_FALLBACK",
      });
    }

    return quotes;
  },
};
