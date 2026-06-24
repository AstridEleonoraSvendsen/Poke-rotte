"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
// Import Clerk components
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Master Sets", external: false },
    { href: "/portfolio", label: "Portfolios", external: false },
    { href: "/database", label: "Card Database", external: false },
    { href: "/dreams", label: "Poke Dreams", external: false },
    { href: "https://www.cardmarket.com/en/Pokemon", label: "Rat Market", external: true },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between"
                    >
                      {item.label}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ) : (
                    <Link href={item.href}>{item.label}</Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">MA</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Pokemon Rats</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50 flex items-center gap-1.5"
                >
                  {item.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Pikachu Icon */}
          <Link href="/database" className="relative h-10 w-10 hover:scale-110 transition-transform">
            <Image 
              src="/pikachu.png" 
              alt="Search Database" 
              fill 
              className="object-contain drop-shadow-md"
              sizes="40px"
            />
          </Link>

          {/* Clerk Auth Buttons */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-[#4f5f4f] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#4f5f4f]/90 transition-all shadow-sm">
                Log In
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <div className="h-9 w-9 overflow-hidden rounded-full border border-border shadow-sm">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
