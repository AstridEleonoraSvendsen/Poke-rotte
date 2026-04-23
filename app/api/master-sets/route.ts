import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// THIS IS THE MAGIC LINE: It forces Vercel to never cache this route
export const dynamic = 'force-dynamic';

const TEMP_USER_ID = "temp-user-123";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT set_id FROM master_sets WHERE user_id = ${TEMP_USER_ID};
    `;
    const setIds = rows.map(row => row.set_id);
    return NextResponse.json({ masterSets: setIds }, { status: 200 });
  } catch (error) {
    console.error("Error fetching master sets:", error);
    return NextResponse.json({ error: "Failed to fetch master sets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { setId } = await request.json();

    if (!setId) {
      return NextResponse.json({ error: "Set ID is required" }, { status: 400 });
    }

    const check = await sql`
      SELECT * FROM master_sets WHERE user_id = ${TEMP_USER_ID} AND set_id = ${setId};
    `;

    if (check.rows.length > 0) {
      return NextResponse.json({ message: "Set already in master sets" }, { status: 200 });
    }

    await sql`
      INSERT INTO master_sets (user_id, set_id) VALUES (${TEMP_USER_ID}, ${setId});
    `;

    return NextResponse.json({ message: "Successfully added to master sets" }, { status: 201 });
  } catch (error) {
    console.error("Error adding to master sets:", error);
    return NextResponse.json({ error: "Failed to add to master sets" }, { status: 500 });
  }
}

// --- NEW DELETE FUNCTION ---
// This allows the cloud database to actually erase the set and its cards
export async function DELETE(request: Request) {
  try {
    const { setId } = await request.json();

    if (!setId) {
      return NextResponse.json({ error: "Set ID is required" }, { status: 400 });
    }

    // 1. Delete the set folder from master_sets
    await sql`
      DELETE FROM master_sets WHERE user_id = ${TEMP_USER_ID} AND set_id = ${setId};
    `;

    // 2. Delete all the individual cards the user checked off for that set
    await sql`
      DELETE FROM owned_cards WHERE user_id = ${TEMP_USER_ID} AND set_id = ${setId};
    `;

    return NextResponse.json({ message: "Successfully deleted from cloud" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting master set:", error);
    return NextResponse.json({ error: "Failed to delete from master sets" }, { status: 500 });
  }
}
