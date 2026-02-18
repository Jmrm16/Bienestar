import React from "react";

interface Nota {
  id: number;
  codigo: string;
  apellidos: string;
  nombres: string;
  identificacion: string;
  programa: string;
  materia: string;
  grupo: string;
  final: number | null;
  anio: number;
  periodo: string;
}

export default function TablaNotas({ notas }: { notas: Nota[] }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm overflow-x-auto">
      <h3 className="font-semibold mb-4">Listado de notas</h3>

      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Estudiante</th>
            <th className="p-2">Identificación</th>
            <th className="p-2">Programa</th>
            <th className="p-2">Materia</th>
            <th className="p-2">Grupo</th>
            <th className="p-2">Final</th>
            <th className="p-2">Periodo</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((n) => (
            <tr key={n.id} className="border-t">
              <td className="p-2">
                {n.nombres} {n.apellidos}
              </td>
              <td className="p-2 text-center">{n.identificacion}</td>
              <td className="p-2">{n.programa}</td>
              <td className="p-2">{n.materia}</td>
              <td className="p-2 text-center">{n.grupo}</td>
              <td className="p-2 text-center font-semibold">
                {n.final ?? "—"}
              </td>
              <td className="p-2 text-center">
                {n.anio}-{n.periodo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {notas.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-6">
          No hay notas registradas
        </p>
      )}
    </div>
  );
}
