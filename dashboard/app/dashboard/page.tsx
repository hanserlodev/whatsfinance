import { getDb } from "@/lib/db";
import Summary from "./components/Summary";
import Chart from "./components/Chart";

export default async function DashboardPage() {
  const db = getDb();

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());

  let gastos = { total: 0 };
  let ingresos = { total: 0 };
  let byCategory: { name: string; total: number }[] = [];
  let recent: any[] = [];

  try {
    gastos = db.prepare(
      "select coalesce(sum(amount), 0) as total from transactions where type = 'gasto' and strftime('%m', occurred_at) = ? and strftime('%Y', occurred_at) = ?"
    ).get(month, year) as { total: number };

    ingresos = db.prepare(
      "select coalesce(sum(amount), 0) as total from transactions where type = 'ingreso' and strftime('%m', occurred_at) = ? and strftime('%Y', occurred_at) = ?"
    ).get(month, year) as { total: number };

    byCategory = db.prepare(
      "select c.name, coalesce(sum(t.amount), 0) as total from transactions t join categories c on t.category_id = c.id where strftime('%m', t.occurred_at) = ? and strftime('%Y', t.occurred_at) = ? group by c.name"
    ).all(month, year) as { name: string; total: number }[];

    recent = db.prepare(
      "select t.*, c.name as category_name from transactions t left join categories c on t.category_id = c.id order by t.created_at desc limit 10"
    ).all() as any[];
  } catch {
    // Tables don't exist yet
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">WhatsFinance Dashboard</h1>
      <Summary gastos={gastos.total} ingresos={ingresos.total} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Chart data={byCategory} title="Gastos por Categoria" />
        <div>
          <h2 className="text-xl font-semibold mb-4">Transacciones Recientes</h2>
          <div className="space-y-2">
            {recent.map((tx: any) => (
              <div key={tx.id} className="bg-gray-800 rounded-lg p-3 flex justify-between">
                <div>
                  <span className={"font-medium " + (tx.type === "gasto" ? "text-red-400" : "text-green-400")}>
                    {tx.type === "gasto" ? "-" : "+"}S/{tx.amount.toFixed(2)}
                  </span>
                  <span className="text-gray-400 ml-2">{tx.category_name}</span>
                </div>
                <span className="text-gray-500 text-sm">{tx.occurred_at}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}