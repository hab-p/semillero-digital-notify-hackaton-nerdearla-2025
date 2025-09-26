import React from 'react'

export const Coordinator: React.FC = () => {
  const mock = {
    name: 'Coordinador Luis',
    metrics: {
      totalStudents: 45,
      atRisk: 8,
      avgGrade: 87.4
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h2 className="text-xl mb-4">Panel de Coordinación - {mock.name}</h2>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded">Total estudiantes: <strong>{mock.metrics.totalStudents}</strong></div>
        <div className="bg-gray-800 p-4 rounded">Estudiantes en riesgo: <strong>{mock.metrics.atRisk}</strong></div>
        <div className="bg-gray-800 p-4 rounded">Promedio general: <strong>{mock.metrics.avgGrade}</strong></div>
      </section>
    </div>
  )
}


