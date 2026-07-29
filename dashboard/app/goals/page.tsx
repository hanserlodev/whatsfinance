import { getDb } from "@/lib/db";

export default async function GoalsPage() {
  const db = getDb();
  let goals: any[] = [];
  try {
    goals = db.prepare("select * from savings_goals").all() as any[];
  } catch {
    // Table doesn't exist yet
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Metas de Ahorro</h1>
      {goals.length === 0 ? (
        <p className="text-gray-400">No hay metas todavia. Crea una desde el dashboard (proximamente).</p>
      ) : (
        <div className="space-y-4">
          {goals.map((g: any) => {
            const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
            return (
              <div key={g.id} className="bg-gray-800 rounded-xl p-5">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold text-lg">{g.name}</h3>
                  <span className="text-gray-400">S/{g.current_amount} / S/{g.target_amount}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: progress + "%" }}></div>
                </div>
                <p className="text-right text-sm text-gray-500 mt-1">{progress.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}