import { Header } from "@/components/header"
import { SetBrowser } from "@/components/set-browser"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function DatabasePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Card Database</h1>
          <p className="mt-1 text-muted-foreground">
            Browse all Pokemon TCG sets and cards
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sets or cards..."
            className="pl-10"
          />
        </div>

        {/* Tabs for English/Japanese */}
        <div className="mb-6 flex gap-4 border-b">
          <button className="border-b-2 border-primary pb-3 text-sm font-medium text-foreground">
            English
          </button>
          <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Japanese
          </button>
        </div>

        {/* Set Browser */}
        <SetBrowser />
      </main>
    </div>
  )
}
