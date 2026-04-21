// components/pro-site/ProSiteFooter.tsx
export function ProSiteFooter({ proName }: { proName: string }) {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-[#111] px-6 py-3 flex justify-between items-center">
      <span className="text-xs text-gray-600">
        © {year} {proName} · kelen.africa
      </span>
      <span className="text-xs font-bold text-[#009639]">Kelen</span>
    </footer>
  )
}
