interface Props {
  gastos: number;
  ingresos: number;
}

export default function Summary({ gastos, ingresos }: Props) {
  const balance = ingresos - gastos;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-gray-800 rounded-xl p-5">
        <p className="text-gray-400 text-sm">Ingresos</p>
        <p className="text-2xl font-bold text-green-400">S/{ingresos.toFixed(2)}</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-5">
        <p className="text-gray-400 text-sm">Gastos</p>
        <p className="text-2xl font-bold text-red-400">S/{gastos.toFixed(2)}</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-5">
        <p className="text-gray-400 text-sm">Balance</p>
        <p className={"text-2xl font-bold " + (balance >= 0 ? "text-green-400" : "text-red-400")}>
          S/{balance.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
