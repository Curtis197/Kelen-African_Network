import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      {/* Logo / brand link */}
      <Link
        href="/"
        className="mb-8 text-2xl font-bold tracking-tight text-foreground"
      >
        Kelen
      </Link>

      {/* Card container */}
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        {children}
      </div>

      {/* Founding phrase */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        La confiance ne se promet pas. Elle se documente.
      </p>
    </div>
  );
}
