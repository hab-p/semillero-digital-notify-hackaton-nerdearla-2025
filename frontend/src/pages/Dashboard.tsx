import React from 'react'

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Semillero Digital - Dashboard</h1>
          <div>
            <button className="bg-gray-800 text-white px-3 py-2 rounded">Cuenta</button>
          </div>
        </header>

        <main>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded">Total Students: <strong>45</strong></div>
            <div className="bg-gray-800 p-4 rounded">Total Courses: <strong>8</strong></div>
            <div className="bg-gray-800 p-4 rounded">Overall Submission Rate: <strong>82%</strong></div>
          </section>

          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded">Recent Activity</div>
            <div className="bg-gray-800 p-4 rounded">Notifications</div>
          </section>
        </main>
      </div>
    </div>
  )
}


