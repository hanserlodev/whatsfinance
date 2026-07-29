import { getDb } from '../../../db';

export async function handleCommand(
  sock: any,
  sender: string,
  text: string,
  userId: number
): Promise<void> {
  const db = getDb();
  const cmd = text.split(' ')[0];

  if (cmd === 'resumen') {
    const gastos = db.prepare(
      "select coalesce(sum(amount), 0) as total from transactions where user_id = ? and type = 'gasto' and strftime('%m', occurred_at) = strftime('%m', 'now')"
    ).get(userId) as any;

    const ingresos = db.prepare(
      "select coalesce(sum(amount), 0) as total from transactions where user_id = ? and type = 'ingreso' and strftime('%m', occurred_at) = strftime('%m', 'now')"
    ).get(userId) as any;

    const balance = ingresos.total - gastos.total;

    await sock.sendMessage(sender, {
      text: 'Resumen del mes:\nIngresos: S/ ' + ingresos.total.toFixed(2) + '\nGastos: S/ ' + gastos.total.toFixed(2) + '\nBalance: S/ ' + balance.toFixed(2),
    });
  } else if (cmd === 'metas') {
    const goals = db.prepare(
      'select name, target_amount, current_amount from savings_goals where user_id = ?'
    ).all(userId) as any[];

    if (goals.length === 0) {
      await sock.sendMessage(sender, { text: 'No tienes metas de ahorro. Crear una en el dashboard.' });
      return;
    }

    let msg = 'Tus metas:\n';
    for (const g of goals) {
      const progress = ((g.current_amount / g.target_amount) * 100).toFixed(0);
      msg += g.name + ': S/ ' + g.current_amount + ' / S/ ' + g.target_amount + ' (' + progress + '%)\n';
    }
    await sock.sendMessage(sender, { text: msg });
  } else if (cmd === 'ayuda') {
    await sock.sendMessage(sender, {
      text: 'Comandos:\n- "gaste [monto] en [categoria]" - registrar gasto\n- "me pagaron [monto] de [categoria]" - registrar ingreso\n- "no, fue [monto]" - corregir ultimo\n- "resumen" - totales del mes\n- "metas" - progreso de metas\n- "ayuda" - este mensaje',
    });
  }
}
