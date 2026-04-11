import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// For now, we'll use a hardcoded user ID until we set up real authentication.
// This allows testing the database connection.
const TEMP_USER_ID = "temp-user-123";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT set_id FROM master_sets WHERE user_id = ${TEMP_USER_ID};
    `;
    // Extract just the set_ids into an array
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

    // Check if it already exists to avoid duplicates
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
