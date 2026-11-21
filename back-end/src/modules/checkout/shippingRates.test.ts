// @ts-ignore - bun:test types provided by bun runtime
import { describe, it, expect } from "bun:test";
import { shippingRatesService } from "./shippingRates.service";

describe("Dynamic Shipping Rates Engine", () => {
  const sampleMethods = [
    {
      id: "DM-PICKUP",
      code: "STORE_PICKUP",
      name: "Ambil di Toko",
      type: "STORE_PICKUP",
      verificationFlow: "CASHIER_HANDOVER",
      isActive: true,
      baseCost: 0,
      estimatedTime: "Instan",
      pricingMode: "FLAT",
      zoneRates: [],
    },
    {
      id: "DM-TRAVEL",
      code: "TRV_ZONE",
      name: "Travel & Kurir Zona",
      type: "TRAVEL_EXPEDITION",
      verificationFlow: "USER_VERIFY_DIRECT",
      isActive: true,
      baseCost: 20000,
      estimatedTime: "1-2 Hari",
      pricingMode: "ZONE_TABLE",
      zoneRates: [
        { city: "Pasaman", cost: 35000, estimatedTime: "1 Hari" },
        { city: "Padang", district: "Koto Tangah", cost: 28000, estimatedTime: "1 Hari" },
      ],
    },
    {
      id: "DM-INACTIVE",
      code: "OFFLINE_COURIER",
      name: "Kurir Nonaktif",
      type: "TRAVEL_EXPEDITION",
      verificationFlow: "USER_VERIFY_DIRECT",
      isActive: false,
      baseCost: 15000,
      estimatedTime: "2 Hari",
      pricingMode: "FLAT",
      zoneRates: [],
    },
  ];

  it("excludes inactive methods and matches city zone rate", async () => {
    const quotes = await shippingRatesService.calculateDynamicRates(sampleMethods, {
      city: "Kab. Pasaman Barat",
      province: "Sumatera Barat",
    });

    expect(quotes.length).toBe(2);
    const travel = quotes.find((q) => q.code === "TRV_ZONE")!;
    expect(travel.cost).toBe(35000);
    expect(travel.pricingSource).toBe("ZONE_TABLE");
    expect(travel.matchedZone).toBe("Pasaman");
  });

  it("matches district+city priority and falls back to baseCost for unmatched cities", async () => {
    const districtQuotes = await shippingRatesService.calculateDynamicRates(sampleMethods, {
      city: "Kota Padang",
      district: "Koto Tangah",
    });
    expect(districtQuotes.find((q) => q.code === "TRV_ZONE")!.cost).toBe(28000);

    const fallbackQuotes = await shippingRatesService.calculateDynamicRates(sampleMethods, {
      city: "Jakarta Selatan",
    });
    const fb = fallbackQuotes.find((q) => q.code === "TRV_ZONE")!;
    expect(fb.cost).toBe(20000);
    expect(fb.pricingSource).toBe("FLAT_FALLBACK");
  });
});
