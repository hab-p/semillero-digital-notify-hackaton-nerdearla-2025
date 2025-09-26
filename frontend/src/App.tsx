import React from 'react'
import { Dashboard } from './pages/Dashboard'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Student } from './pages/Student'
import { Teacher } from './pages/Teacher'
import { Coordinator } from './pages/Coordinator'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/student" element={<Student />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/coordinator" element={<Coordinator />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}


