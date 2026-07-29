import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import { getDb } from '../../db';
import { handleMessage } from './handlers/transaction-handler';
import { handleCommand } from './handlers/command-handler';

const SESSION_PATH = process.env.WHATSAPP_SESSION_PATH || './sessions';

async function start() {
  const db = getDb();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Escanea el QR de arriba con WhatsApp');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión cerrada. Reconectando:', shouldReconnect);
      if (shouldReconnect) start();
    }

    if (connection === 'open') {
      console.log('WhatsApp conectado correctamente');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message?.conversation) {
      const text = msg.message.conversation.trim().toLowerCase();
      const sender = msg.key.remoteJid!;
      const userNumber = sender.replace('@s.whatsapp.net', '');

      const userDb = db.prepare('select id from users where whatsapp_number = ?').get(userNumber) as any;
      let userId: number;
      if (userDb) {
        userId = userDb.id;
      } else {
        const r = db.prepare('insert into users (whatsapp_number) values (?)').run(userNumber);
        userId = r.lastInsertRowid as number;
      }

      if (['resumen', 'metas', 'ayuda'].includes(text.split(' ')[0])) {
        await handleCommand(sock, sender, text, userId);
      } else {
        await handleMessage(sock, sender, text, userId);
      }
    }
  });

  console.log('WhatsFinance Bot iniciado');
}

start().catch(console.error);