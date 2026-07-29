import { proto } from '@whiskeysockets/baileys';
import { getDb } from '../../../db';
import { parseMessage } from '../ai';

export async function handleMessage(
  sock: any,
  sender: string,
  text: string,
  userId: number
): Promise<void> {
  const parsed = await parseMessage(text, userId);
  if (!parsed) {
    await sock.sendMessage(sender, {
      text: 'No entendi. Escribe algo como: "gaste 45 soles en almuerzo" o "me pagaron 800 de freelance"',
    });
    return;
  }

  if (parsed.confidence === 'baja') {
    await sock.sendMessage(sender, {
      text: 'No estoy seguro del registro. Podrias reformularlo con mas detalle?',
    });
    return;
  }

  const db = getDb();

  if (parsed.isCorrection) {
    const lastTx = db.prepare(
      'select id from transactions where user_id = ? order by created_at desc limit 1'
    ).get(userId) as any;

    if (lastTx) {
      const cat = db.prepare(
        'select id from categories where user_id = ? and name = ? and type = ?'
      ).get(userId, parsed.category, parsed.type) as any;

      db.prepare(
        'update transactions set amount = ?, category_id = ?, description = ? where id = ?'
      ).run(parsed.amount, cat?.id || null, parsed.description || null, lastTx.id);

      await sock.sendMessage(sender, {
        text: 'Corregido: ' + parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1) + ' - S/ ' + parsed.amount.toFixed(2) + ' - ' + parsed.category,
      });
    }
    return;
  }

  const cat = db.prepare(
    'select id from categories where user_id = ? and name = ? and type = ?'
  ).get(userId, parsed.category, parsed.type) as any;

  if (!cat) {
    const r = db.prepare(
      'insert into categories (user_id, name, type) values (?, ?, ?)'
    ).run(userId, parsed.category, parsed.type);
  }

  const catId = cat?.id || (db.prepare(
    'select id from categories where user_id = ? and name = ? and type = ?'
  ).get(userId, parsed.category, parsed.type) as any)?.id;

  db.prepare(
    'insert into transactions (user_id, category_id, type, amount, description, raw_message) values (?, ?, ?, ?, ?, ?)'
  ).run(userId, catId, parsed.type, parsed.amount, parsed.description || null, text);

  await sock.sendMessage(sender, {
    text: 'Registrado: ' + parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1) + ' - S/ ' + parsed.amount.toFixed(2) + ' - ' + parsed.category + ' - hoy',
  });
}
