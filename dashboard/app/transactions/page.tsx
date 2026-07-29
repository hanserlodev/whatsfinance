import { getDb } from "@/lib/db";

export default async function TransactionsPage() {
  const db = getDb();
  let transactions: any[] = [];
  try {
    transactions = db.prepare(
      "select t.*, c.name as category_name from transactions t left join categories c on t.category_id = c.id order by t.created_at desc limit 50"
    ).all() as any[];
  } catch {
    // Table doesn't exist yet
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Historial de Transacciones</h1>
      <table className="w-full text-left">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="pb-3">Fecha</th>
            <th className="pb-3">Tipo</th>
            <th className="pb-3">Monto</th>
            <th className="pb-3">Categoria</th>
            <th className="pb-3">Descripcion</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx: any) => (
            <tr key={tx.id} className="border-b border-gray-800">
              <td className="py-3 text-gray-400">{tx.occurred_at}</td>
              <td className="py-3">
                <span className={"px-2 py-1 rounded text-sm " + (tx.type === "gasto" ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300")}>
                  {tx.type}
                </span>
              </td>
              <td className="py-3 font-medium">S/{tx.amount.toFixed(2)}</td>
              <td className="py-3 text-gray-300">{tx.category_name}</td>
              <td className="py-3 text-gray-500">{tx.description || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}