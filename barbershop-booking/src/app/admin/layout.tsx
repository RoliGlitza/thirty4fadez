import { Analytics } from "@vercel/analytics/next"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-6 max-w-sm mx-auto">
      {children}
      <Analytics />
    </div>
  )
}
