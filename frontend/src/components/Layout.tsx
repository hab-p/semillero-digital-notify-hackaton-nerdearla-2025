import React from 'react'
import { Link } from 'react-router-dom'

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex">
        <aside className="w-60 bg-gray-800 p-4">
          <div className="mb-6 text-lg font-semibold">Semillero</div>
          <nav className="flex flex-col gap-2">
            <Link to="/student" className="text-gray-200 hover:underline">Alumno</Link>
            <Link to="/teacher" className="text-gray-200 hover:underline">Profesor</Link>
            <Link to="/coordinator" className="text-gray-200 hover:underline">Coordinador</Link>
          </nav>
        </aside>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}


