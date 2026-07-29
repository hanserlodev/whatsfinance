import { parseByNim } from './nim-parser';
import { parseByRegex, ParsedTransaction } from './regex-parser';
import { getDb } from '../../../db';

export async function parseMessage(
  text: string,
  userId: number
): Promise<ParsedTransaction | null> {
  const db = getDb();
  const userCats = db.prepare(
    'select name from categories where user_id = ?'
  ).all(userId) as { name: string }[];
  const categories = userCats.map((c) => c.name);

  if (process.env.NIM_API_KEY) {
    try {
      const result = await parseByNim(text, categories);
      if (result) return result;
    } catch {
      // fallback to regex
    }
  }

  return parseByRegex(text);
}
