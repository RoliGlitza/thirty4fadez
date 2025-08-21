'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const navItems = [
  { label: 'Termine', href: '/admin' },
  { label: 'Slots', href: '/admin/slots' },
  { label: 'Verfügbarkeit', href: '/admin/availability' },
]

export default function AdminNavbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Logo oben, nicht sticky */}
      <div className="pt-4 pb-4 flex justify-center">
        <Image src="/logo.png" alt="Logo" width={120} height={120} priority />
      </div>

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="flex justify-around py-3 text-sm text-white">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 rounded ${
                  isActive
                    ? 'bg-[#FC02BF] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
