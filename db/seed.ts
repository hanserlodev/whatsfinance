import Database from 'better-sqlite3';

const DEFAULT_CATEGORIES = [
  { name: 'Comida', type: 'gasto' },
  { name: 'Transporte', type: 'gasto' },
  { name: 'Vivienda', type: 'gasto' },
  { name: 'Salud', type: 'gasto' },
  { name: 'Entretenimiento', type: 'gasto' },
  { name: 'Educación', type: 'gasto' },
  { name: 'Ropa', type: 'gasto' },
  { name: 'Otros', type: 'gasto' },
  { name: 'Sueldo', type: 'ingreso' },
  { name: 'Freelance', type: 'ingreso' },
  { name: 'Otros ingresos', type: 'ingreso' },
];

export function seedDefaults(db: Database.Database, userId: number = 1): void {
  const insert = db.prepare(
    'insert into categories (user_id, name, type) values (?, ?, ?)'
  );

  const tx = db.transaction(() => {
    for (const cat of DEFAULT_CATEGORIES) {
      insert.run(userId, cat.name, cat.type);
    }
  });

  tx();
}