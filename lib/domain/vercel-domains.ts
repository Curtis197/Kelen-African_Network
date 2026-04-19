// lib/domain/vercel-domains.ts

const VERCEL_TOKEN      = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const VERCEL_TEAM_ID    = process.env.VERCEL_TEAM_ID;

function vercelHeaders() {
  return {
    "Authorization": `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function projectUrl(path: string) {
  const base = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}${path}`;
  return VERCEL_TEAM_ID ? `${base}?teamId=${VERCEL_TEAM_ID}` : base;
}

export type DomainRegistrationResult = {
  success: boolean;
  domain: string;
  verified: boolean;
  errorMessage?: string;
};

export async function addDomainToVercel(domain: string): Promise<DomainRegistrationResult> {
  console.log('[API] addDomainToVercel: start', { domain });

  const res = await fetch(projectUrl("/domains"), {
    method: "POST",
    headers: vercelHeaders(),
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log('[API] addDomainToVercel: failed', { domain, error: data.error?.message });
    return {
      success: false,
      domain,
      verified: false,
      errorMessage: data.error?.message ?? "Vercel domain registration failed",
    };
  }

  console.log('[API] addDomainToVercel: done', { domain, verified: data.verified });
  return {
    success: true,
    domain,
    verified: data.verified ?? false,
  };
}

export async function checkDomainStatus(domain: string): Promise<{ verified: boolean; reason?: string }> {
  console.log('[API] checkDomainStatus: start', { domain });

  const res = await fetch(projectUrl(`/domains/${domain}`), {
    headers: vercelHeaders(),
  });

  if (!res.ok) {
    console.log('[API] checkDomainStatus: not found', { domain });
    return { verified: false, reason: "Domain not found on Vercel" };
  }

  const data = await res.json();
  console.log('[API] checkDomainStatus: done', { domain, verified: data.verified });
  return { verified: data.verified ?? false };
}
