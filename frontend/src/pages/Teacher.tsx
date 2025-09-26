import React from 'react'

export const Teacher: React.FC = () => {
  const mock = {
    name: 'Profesora Ana',
    courses: [
      { id: 'c1', name: 'Desarrollo Web', assignmentsDue: 2 },
      { id: 'c3', name: 'JavaScript Avanzado', assignmentsDue: 1 }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h2 className="text-xl mb-4">Hola, {mock.name}</h2>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="font-semibold mb-2">Tus cursos</h3>
          <ul>
            {mock.courses.map(c => (
              <li key={c.id} className="mb-2 flex justify-between">
                <span>{c.name}</span>
                <span className="text-sm text-gray-300">{c.assignmentsDue} tareas</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-800 p-4 rounded">Crear nueva tarea (mock UI)</div>
      </section>
    </div>
  )
}


