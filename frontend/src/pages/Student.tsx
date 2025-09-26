import React from 'react'

export const Student: React.FC = () => {
  const mock = {
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    courses: [
      { id: 'c1', name: 'Desarrollo Web', progress: 0.8 },
      { id: 'c2', name: 'Backend Node.js', progress: 0.6 }
    ],
    notifications: [
      { id: 'n1', title: 'Nueva tarea: HTML Básico', time: '2025-01-27 10:00' }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h2 className="text-xl mb-4">Bienvenido, {mock.name}</h2>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="font-semibold mb-2">Cursos</h3>
          <ul>
            {mock.courses.map(c => (
              <li key={c.id} className="mb-2">
                <div className="flex justify-between">
                  <span>{c.name}</span>
                  <span>{Math.round(c.progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded mt-2">
                  <div className="bg-green-500 h-2 rounded" style={{ width: `${c.progress * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="font-semibold mb-2">Notificaciones</h3>
          <ul>
            {mock.notifications.map(n => (
              <li key={n.id} className="mb-2">
                <div className="text-sm">{n.title}</div>
                <div className="text-xs text-gray-400">{n.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}


