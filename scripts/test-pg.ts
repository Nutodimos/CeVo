import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Testing with URL:", connectionString);
  
  const pool1 = new Pool({ connectionString });
  try {
    const res = await pool1.query("SELECT 1 as res");
    console.log("Pool 1 (no ssl option) success:", res.rows);
  } catch (err) {
    console.error("Pool 1 failed:", err instanceof Error ? err.message : String(err));
  }
  
  const pool2 = new Pool({ connectionString, ssl: true });
  try {
    const res2 = await pool2.query("SELECT 2 as res");
    console.log("Pool 2 (ssl: true) success:", res2.rows);
  } catch (err) {
    console.error("Pool 2 failed:", err instanceof Error ? err.message : String(err));
  }
}

main();
