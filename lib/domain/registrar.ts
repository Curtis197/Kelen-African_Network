// lib/domain/registrar.ts
// PLACEHOLDER: Replace REGISTRAR_API_URL, REGISTRAR_API_KEY, REGISTRAR_API_USER
// in .env.local when a registrar is chosen (Namecheap, OpenSRS, CheapDomain, etc.)

const REGISTRAR_API_URL = process.env.REGISTRAR_API_URL;
const REGISTRAR_API_KEY = process.env.REGISTRAR_API_KEY;
const REGISTRAR_USER    = process.env.REGISTRAR_API_USER;

export type DomainAvailability = {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
};

export type PurchaseResult = {
  success: boolean;
  domain: string;
  expiresAt?: string;
  errorMessage?: string;
};

function assertConfigured() {
  if (!REGISTRAR_API_URL || !REGISTRAR_API_KEY || !REGISTRAR_USER) {
    throw new Error(
      "Registrar not configured. Set REGISTRAR_API_URL, REGISTRAR_API_KEY, REGISTRAR_API_USER in .env.local."
    );
  }
}

export async function checkDomainAvailability(domain: string): Promise<DomainAvailability> {
  console.log('[API] checkDomainAvailability: start', { domain });
  assertConfigured();

  const url = new URL(`${REGISTRAR_API_URL}/domains/check`);
  url.searchParams.set("domain", domain);

  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${REGISTRAR_API_KEY}`,
      "X-Username": REGISTRAR_USER!,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Registrar check failed: ${res.status}`);

  const data = await res.json();
  console.log('[API] checkDomainAvailability: done', { domain, available: data.available });
  return {
    domain,
    available: data.available ?? false,
    price: data.price,
    currency: data.currency ?? "USD",
  };
}

export async function purchaseDomain(
  domain: string,
  registrantInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  }
): Promise<PurchaseResult> {
  console.log('[API] purchaseDomain: start', { domain, registrantCity: registrantInfo.city });
  assertConfigured();

  const res = await fetch(`${REGISTRAR_API_URL}/domains/purchase`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REGISTRAR_API_KEY}`,
      "X-Username": REGISTRAR_USER!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ domain, registrant: registrantInfo, years: 1 }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log('[API] purchaseDomain: failed', { domain, message: data.message });
    return { success: false, domain, errorMessage: data.message ?? "Purchase failed" };
  }

  console.log('[API] purchaseDomain: done', { domain, expiresAt: data.expires_at });
  return { success: true, domain, expiresAt: data.expires_at };
}
