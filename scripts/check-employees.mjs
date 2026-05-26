import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT id, nickname, sortOrder FROM employees ORDER BY sortOrder");
console.log("Total:", rows.length);
for (const r of rows) {
  console.log(`id=${r.id} sort=${r.sortOrder} name=${r.nickname}`);
}
await conn.end();
