import { cn } from "@/lib/utils"

export function PokeballSpinner({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      // Tailwind's animate-spin, combined with your custom class styling
      className={cn("animate-spin rounded-full", className)} 
      // Slows the spin down to a comfortable 1.5 seconds
      style={{ animationDuration: '1.5s' }} 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red Top Half */}
      <path d="M 5,50 a 45,45 0 1,1 90,0 z" fill="#ef4444" />
      
      {/* White Bottom Half */}
      <path d="M 5,50 a 45,45 0 0,0 90,0 z" fill="#ffffff" />
      
      {/* Outlines (Uses currentColor so it adapts to Light/Dark mode) */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="6" />
      
      {/* Center Button */}
      <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="currentColor" strokeWidth="6" />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
    </svg>
  )
}
