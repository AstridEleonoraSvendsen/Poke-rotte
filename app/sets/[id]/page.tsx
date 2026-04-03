import { getSet, getSetCards } from "@/lib/pokemon"
import Link from "next/link"

export default async function SetPage(props: { params: Promise<{ id: string }> | { id: string } }) {
  // This line handles BOTH Next.js 14 and Next.js 15 safely
  const params = await props.params;
  const id = params.id;

  try {
    // Fetch data from your API helper
    const [set, cards] = await Promise.all([
      getSet(id),
      getSetCards(id)
    ])

    if (!set) {
      return <div style={{ padding: '100px', textAlign: 'center' }}>Set not found.</div>
    }

    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Simple Back Button */}
        <Link href="/" style={{ textDecoration: 'underline', color: '#666', fontSize: '14px' }}>
          ← Back to Sets
        </Link>

        {/* Header */}
        <div style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>{set.name}</h1>
          <p>{cards?.length || 0} Cards in this set</p>
        </div>

        {/* The Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '20px', 
          marginTop: '30px' 
        }}>
          {cards && cards.map((card: any) => (
            <div key={card.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <img 
                src={card.images?.small} 
                alt={card.name} 
                style={{ width: '100%', display: 'block' }} 
                loading="lazy" 
              />
              <div style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                {card.name}
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  } catch (error) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>This set might be too large for the API to load quickly.</p>
        <Link href="/">Return Home</Link>
      </div>
    )
  }
}
