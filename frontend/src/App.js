import React, { useState, useEffect, createContext, useContext } from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (sessionId) => {
    try {
      const response = await axios.post(`${API}/auth/session`, 
        { session_id: sessionId }, 
        { withCredentials: true }
      );
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Login Component
const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for session_id in URL fragment
    const hash = location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      handleSessionId(sessionId);
    }
    
    // If already authenticated, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, location, navigate]);

  const handleSessionId = async (sessionId) => {
    setLoading(true);
    try {
      await login(sessionId);
      // Clean URL fragment
      window.history.replaceState(null, null, window.location.pathname);
      navigate('/dashboard');
    } catch (error) {
      console.error('Authentication error:', error);
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/login`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Autenticando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Semillero Digital</h1>
          <p className="text-gray-600">Plataforma de Gestión Educativa</p>
        </div>
        
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">¿Qué es esta plataforma?</h2>
            <p className="text-sm text-blue-800">
              Una herramienta complementaria a Google Classroom que te ayuda a:
            </p>
            <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
              <li>Hacer seguimiento del progreso estudiantil</li>
              <li>Ver métricas de rendimiento claras</li>
              <li>Recibir notificaciones importantes</li>
            </ul>
          </div>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Iniciar sesión con Google
        </button>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Usa tu cuenta de Google institucional para acceder</p>
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Semillero Digital</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img 
                src={user?.picture || 'https://via.placeholder.com/32'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [progressRes, metricsRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/dashboard/progress`, { withCredentials: true }),
        axios.get(`${API}/dashboard/metrics`, { withCredentials: true }),
        axios.get(`${API}/notifications`, { withCredentials: true })
      ]);
      
      setProgress(progressRes.data);
      setMetrics(metricsRes.data);
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getRoleBasedView = () => {
    switch (user.role) {
      case 'coordinator':
        return <CoordinatorDashboard metrics={metrics} />;
      case 'teacher':
        return <TeacherDashboard progress={progress} />;
      default:
        return <StudentDashboard progress={progress.filter(p => p.student_email === user.email)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Notifications Bar */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Notificaciones Recientes</h3>
              <div className="space-y-2">
                {notifications.slice(0, 3).map(notif => (
                  <div key={notif.id} className="text-sm text-yellow-800">
                    <span className="font-medium">{notif.title}</span> - {notif.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {getRoleBasedView()}
      </main>
    </div>
  );
};

// Coordinator Dashboard
const CoordinatorDashboard = ({ metrics }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Panel de Coordinación</h2>
        <p className="text-gray-600">Vista general del programa Semillero Digital</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{metrics?.total_students}</div>
          <div className="text-gray-600">Estudiantes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{metrics?.total_teachers}</div>
          <div className="text-gray-600">Profesores</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">{metrics?.total_classes}</div>
          <div className="text-gray-600">Clases</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-orange-600">{metrics?.students_at_risk}</div>
          <div className="text-gray-600">En Riesgo</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas Generales</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Tasa de Entrega</span>
              <span className="font-semibold">{(metrics?.overall_submission_rate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Promedio General</span>
              <span className="font-semibold">{metrics?.average_grade.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tareas</span>
              <span className="font-semibold">{metrics?.total_assignments}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {metrics?.recent_activity?.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <span className="font-medium">{activity.student || activity.class}</span>
                  <span className="text-gray-600"> - {activity.assignment}</span>
                  {activity.grade && <span className="text-green-600"> ({activity.grade})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Teacher Dashboard
const TeacherDashboard = ({ progress }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Panel del Profesor</h2>
        <p className="text-gray-600">Progreso de tus estudiantes</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Progreso por Estudiante</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {progress.map((student) => (
              <div key={student.student_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{student.student_name}</h4>
                    <p className="text-sm text-gray-600">{student.classroom_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {student.average_grade ? student.average_grade.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Promedio</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Entregadas:</span>
                    <span className="ml-2 font-medium">{student.submitted_assignments}/{student.total_assignments}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Calificadas:</span>
                    <span className="ml-2 font-medium">{student.graded_assignments}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pendientes:</span>
                    <span className="ml-2 font-medium text-orange-600">{student.pending_assignments}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tasa:</span>
                    <span className="ml-2 font-medium">{(student.submission_rate * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${student.submission_rate * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Dashboard
const StudentDashboard = ({ progress }) => {
  const studentProgress = progress[0] || {};

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Mi Progreso</h2>
        <p className="text-gray-600">Seguimiento de tus actividades académicas</p>
      </div>

      {studentProgress.student_name && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{studentProgress.submitted_assignments || 0}</div>
            <div className="text-gray-600">Tareas Entregadas</div>
            <div className="text-sm text-gray-500">de {studentProgress.total_assignments || 0} totales</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">
              {studentProgress.average_grade ? studentProgress.average_grade.toFixed(1) : 'N/A'}
            </div>
            <div className="text-gray-600">Promedio</div>
            <div className="text-sm text-gray-500">de {studentProgress.graded_assignments || 0} calificadas</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600">{studentProgress.pending_assignments || 0}</div>
            <div className="text-gray-600">Pendientes</div>
            <div className="text-sm text-gray-500">por entregar</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Mi Rendimiento</h3>
        {studentProgress.student_name ? (
          <div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span>Tasa de Entrega</span>
                <span className="font-semibold">{(studentProgress.submission_rate * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full" 
                  style={{ width: `${studentProgress.submission_rate * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Clase: <span className="font-medium">{studentProgress.classroom_name}</span></p>
              <p className="mt-2">
                {studentProgress.submission_rate >= 0.8 ? 
                  "¡Excelente trabajo! Mantén este ritmo." :
                  studentProgress.submission_rate >= 0.6 ?
                  "Buen progreso, pero puedes mejorar." :
                  "Necesitas ponerte al día con las entregas."
                }
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No hay datos de progreso disponibles aún.</p>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;