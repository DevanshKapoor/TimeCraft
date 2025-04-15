import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';

// Auth Context
const AuthContext = React.createContext(null);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUser(decoded);
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Login Component
const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) throw new Error('Invalid credentials');
      
      const data = await response.json();
      login(data.token);
      navigate('/timetable');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center">Login</h2>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full px-3 py-2 border rounded-md"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 border rounded-md"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

// Register Component remains the same...
const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'student',
    batch: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Registration failed');
      
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center">Register</h2>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
          </div>
          {formData.role === 'student' && (
            <div>
              <input
                type="text"
                placeholder="Batch (e.g., 2024-CS)"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};
// Timetable Component with fixes
const Timetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  const [error, setError] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    startTime: '',
    endTime: '',
    classroomId: '',
  });

  // Fixed fetchTimetable function
  const fetchTimetable = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/timetable/timetable', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch timetable');
      }

      const data = await response.json();
      setTimetable(data);
      setError(null);
    } catch (err) {
      console.error('Timetable fetch error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [user]);

  const handleCancel = async (classId) => {
    try {
      const response = await fetch('http://localhost:3000/api/timetable/cancel-class', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel class');
      }

      await fetchTimetable(); // Immediate refresh
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePostpone = async (classId) => {
    try {
      setSelectedClass(classId);
      setError(null);  // Clear any previous errors
      
      // First get the class details to know what time slot we're looking for
      const classResponse = await fetch(`http://localhost:3000/api/timetable/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!classResponse.ok) {
        throw new Error('Failed to get class details');
      }
      
      const classDetails = await classResponse.json();

      // Then get available rooms
      const roomsResponse = await fetch('http://localhost:3000/api/timetable/available-rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0], // Current date as default
          startTime: classDetails[0].start_time,
          endTime: classDetails[0].end_time,
        }),
      });
    

      if (!roomsResponse.ok) {
        throw new Error('Failed to get available rooms');
      }
      
      const rooms = await roomsResponse.json();
      if (rooms.length === 0) {
        alert('No rooms available for the selected time slot.');
        return;
      }
      setAvailableRooms(rooms);
      
      // Set initial values for the new schedule
      setNewSchedule({
        date: new Date().toISOString().split('T')[0],
        startTime: classDetails[0].start_time.slice(0, 5),
        endTime: classDetails[0].end_time.slice(0, 5),
        classroomId: '',
      });
    } catch (error) {
      console.error('Error in handlePostpone:', error);
      setError(error.message);
    }
  };
  
  const confirmPostpone = async () => {
    try {
      setScheduleError(null);

      if (!newSchedule.date || !newSchedule.startTime || !newSchedule.endTime || !newSchedule.classroomId) {
        throw new Error('Please fill in all fields');
      }
  
      const response = await fetch('http://localhost:3000/api/timetable/postpone-class', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass,
          newDate: newSchedule.date,
          newStartTime: newSchedule.startTime,
          newEndTime: newSchedule.endTime,
          newClassroomId: newSchedule.classroomId,
          validUntil: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0] // One week from now
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to postpone class');
      }
  
      // Reset states and refresh timetable
      setSelectedClass(null);
      setNewSchedule({
        date: '',
        startTime: '',
        endTime: '',
        classroomId: ''
      });
      await fetchTimetable();
    } catch (error) {
      console.error('Error in confirmPostpone:', error);
      setError(error.message);
      setScheduleError(error.message);

    }
  };


  const groupByDay = (classes) => {
    const groupedClasses = classes.reduce((acc, cls) => {
      // Determine the day for the class
      let day;
      if (cls.modification_type === 'postponed' && cls.new_date) {
        // For postponed classes, use the new date
        const newDate = new Date(cls.new_date);
        day = newDate.getDay(); // getDay() returns 0-6 (Sun-Sat)
      } else {
        // For regular and cancelled classes, use day_of_week
        day = cls.day_of_week;
      }

      // Adjust day to match our days array (0-6 to 1-7)
      day = day === 0 ? 7 : day;

      if (!acc[day]) acc[day] = [];
      acc[day].push(cls);
      return acc;
    }, {});

    return groupedClasses;
  };

  // Adjusted days array to match database days (1-7, Mon-Sun)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const groupedTimetable = groupByDay(timetable);

  const formatTime = (timeString) => {
    try {
      // Handle both date-time strings and time-only strings
      const time = timeString.includes('T') 
        ? new Date(timeString)
        : new Date(`2000-01-01T${timeString}`);
      
      return time.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (err) {
      console.error('Error formatting time:', err);
      return timeString; // Return original string if parsing fails
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading timetable: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Timetable</h2>
      <div className="space-y-4">
        {days.map((day, index) => (
          <div key={day} className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">{day}</h3>
            <div className="space-y-2">
              {groupedTimetable[index + 1]?.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-lg ${
                    cls.modification_type === 'cancelled'
                      ? 'bg-rose-300 line-through text-gray-500'  // More distinct cancelled style
                      : cls.modification_type === 'postponed'
                      ? 'bg-lime-300'
                      : 'bg-white border'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{cls.course_name}</p>
                      {user.role === 'student' && (
                        <p className="text-sm text-gray-600">Faculty: {cls.faculty_name}</p>
                      )}

                      {user.role === 'professor' && (
                        <p className="text-sm text-gray-600">
                          Batch: {cls.batch}
                        </p>
                      )}

                      <p>
                        {formatTime(cls.modification_type === 'postponed' ? cls.new_start_time : cls.start_time)} 
                        {' - '}
                        {formatTime(cls.modification_type === 'postponed' ? cls.new_end_time : cls.end_time)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Room: {cls.room_number} ({cls.building})
                      </p>
                      {cls.modification_type && (
                        <p className="text-sm text-gray-600 font-bold">
                          Status: {cls.modification_type}
                        </p>
                      )}
                      {cls.modification_type === 'postponed' && cls.new_date && (
                        <p className="text-sm text-gray-600">
                          New Date: {new Date(cls.new_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {user.role === 'professor' && !cls.modification_type && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleCancel(cls.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handlePostpone(cls.id)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                        >
                          Postpone
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Postpone Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Postpone Class</h3>
            {scheduleError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Schedule Conflict: </strong>
                <span className="block sm:inline">{scheduleError}</span>
              </div>
            )}
            <div className="space-y-4">
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={newSchedule.date}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, date: e.target.value })
                }
              />
              <input
                type="time"
                className="w-full px-3 py-2 border rounded-md"
                value={newSchedule.startTime}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, startTime: e.target.value })
                }
              />
              <input
                type="time"
                className="w-full px-3 py-2 border rounded-md"
                value={newSchedule.endTime}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, endTime: e.target.value })
                }
              />
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={newSchedule.classroomId}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, classroomId: e.target.value })
                }
              >
                <option value="">Select Classroom</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} (Capacity: {room.capacity})
                  </option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    setScheduleError(null);
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPostpone}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Other components (ProtectedRoute, Navbar, NotFound, LandingPage) remain the same...


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Navigation Component
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/timetable" className="text-xl font-bold">
          Timetable System
        </Link>
        <div className="space-x-4">
          {user ? (
            <>
              <span>Welcome, {user.username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">Login</Link>
              <Link to="/register" className="hover:text-blue-200">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Existing Timetable component remains the same...

// NotFound Component
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 mb-4">Page not found</p>
        <Link to="/timetable" className="text-blue-600 hover:text-blue-700">
          Go to Timetable
        </Link>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/timetable');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Welcome to the Timetable Management System
        </h1>
        <p className="text-gray-600 mb-8">
          Efficiently manage your class schedules, track modifications, and stay updated with your academic calendar.
        </p>
        <div className="space-x-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-white text-blue-600 rounded-md border border-blue-600 hover:bg-blue-50"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <Timetable />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;




// =======================================================================================================================================================
// =======================================================================================================================================================
// =======================================================================================================================================================
// =======================================================================================================================================================








// import React, { useState, useEffect } from 'react';
// import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';

// // Auth Context
// const AuthContext = React.createContext(null);

// const useAuth = () => {
//   const context = React.useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// // Auth Provider Component
// const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       const decoded = JSON.parse(atob(token.split('.')[1]));
//       setUser(decoded);
//     }
//     setLoading(false);
//   }, []);

//   const login = (token) => {
//     localStorage.setItem('token', token);
//     const decoded = JSON.parse(atob(token.split('.')[1]));
//     setUser(decoded);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading }}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// // Login Component
// const Login = () => {
//   const [credentials, setCredentials] = useState({ username: '', password: '' });
//   const [error, setError] = useState('');
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:3000/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(credentials),
//       });
      
//       if (!response.ok) throw new Error('Invalid credentials');
      
//       const data = await response.json();
//       login(data.token);
//       navigate('/timetable');
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <motion.div 
//       initial={{ opacity: 0, y: 50 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="min-h-screen flex items-center justify-center bg-neutral-900"
//     >
//       <div className="max-w-md w-full space-y-8 p-8 bg-neutral-800 rounded-2xl shadow-2xl border border-purple-600/30 relative overflow-hidden">
//         <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-600/30 rounded-full blur-2xl"></div>
//         <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-600/30 rounded-full blur-2xl"></div>
        
//         <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
//           Login
//         </h2>
        
//         {error && (
//           <motion.div 
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-red-400 text-center bg-red-900/30 p-2 rounded-md"
//           >
//             {error}
//           </motion.div>
//         )}
        
//         <form onSubmit={handleSubmit} className="mt-8 space-y-6">
//           <motion.div 
//             whileFocus={{ scale: 1.02 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <input
//               type="text"
//               placeholder="Username"
//               className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//               value={credentials.username}
//               onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
//             />
//           </motion.div>
//           <motion.div 
//             whileFocus={{ scale: 1.02 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <input
//               type="password"
//               placeholder="Password"
//               className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//               value={credentials.password}
//               onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
//             />
//           </motion.div>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-300 ease-in-out transform hover:shadow-neon"
//           >
//             Login
//           </motion.button>
//         </form>
//       </div>
//     </motion.div>
//   );
// };

// // Register Component remains the same...
// const Register = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     password: '',
//     email: '',
//     role: 'student',
//     batch: '',
//   });
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:3000/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });
      
//       if (!response.ok) throw new Error('Registration failed');
      
//       navigate('/login');
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <motion.div 
//       initial={{ opacity: 0, y: 50 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="min-h-screen flex items-center justify-center bg-neutral-900 p-4"
//     >
//       <div className="max-w-md w-full space-y-8 p-8 bg-neutral-800 rounded-2xl shadow-2xl border border-purple-600/30 relative overflow-hidden">
//         {/* Blurred background elements */}
//         <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-600/30 rounded-full blur-2xl"></div>
//         <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-600/30 rounded-full blur-2xl"></div>
        
//         <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
//           Register
//         </h2>
        
//         {error && (
//           <motion.div 
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-red-400 text-center bg-red-900/30 p-2 rounded-md"
//           >
//             {error}
//           </motion.div>
//         )}
        
//         <form onSubmit={handleSubmit} className="mt-8 space-y-6">
//           {/* Username Input */}
//           <motion.div 
//             whileFocus={{ scale: 1.02 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <input
//               type="text"
//               placeholder="Username"
//               className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
//               value={formData.username}
//               onChange={(e) => setFormData({ ...formData, username: e.target.value })}
//             />
//           </motion.div>

//           {/* Password Input */}
//           <motion.div 
//             whileFocus={{ scale: 1.02 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <input
//               type="password"
//               placeholder="Password"
//               className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
//               value={formData.password}
//               onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//             />
//           </motion.div>

//           {/* Email Input */}
//           <motion.div 
//             whileFocus={{ scale: 1.02 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <input
//               type="email"
//               placeholder="Email"
//               className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
//               value={formData.email}
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//             />
//           </motion.div>

//           {/* Role Select */}
//           <motion.div 
//             whileFocus={{ scale: 1.02 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <select
//               className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
//               value={formData.role}
//               onChange={(e) => setFormData({ ...formData, role: e.target.value })}
//             >
//               <option value="student" className="bg-neutral-800">Student</option>
//               <option value="professor" className="bg-neutral-800">Professor</option>
//             </select>
//           </motion.div>

//           {/* Batch Input (for students) */}
//           {formData.role === 'student' && (
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3 }}
//               whileFocus={{ scale: 1.02 }}
//             >
//               <input
//                 type="text"
//                 placeholder="Batch (e.g., 2024-CS)"
//                 className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
//                 value={formData.batch}
//                 onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
//               />
//             </motion.div>
//           )}

//           {/* Submit Button */}
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-300 ease-in-out transform hover:shadow-neon"
//           >
//             Register
//           </motion.button>
//         </form>
//       </div>
//     </motion.div>
//   );
// };

// // Timetable Component with fixes
// const Timetable = () => {
//   const { user } = useAuth();
//   const [timetable, setTimetable] = useState([]);
//   const [selectedClass, setSelectedClass] = useState(null);
//   const [scheduleError, setScheduleError] = useState(null);
//   const [error, setError] = useState(null);
//   const [availableRooms, setAvailableRooms] = useState([]);
//   const [newSchedule, setNewSchedule] = useState({
//     date: '',
//     startTime: '',
//     endTime: '',
//     classroomId: '',
//   });

//   // Fixed fetchTimetable function
//   const fetchTimetable = async () => {
//     try {
//       const response = await fetch('http://localhost:3000/api/timetable/timetable', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         },
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to fetch timetable');
//       }

//       const data = await response.json();
//       setTimetable(data);
//       setError(null);
//     } catch (err) {
//       console.error('Timetable fetch error:', err);
//       setError(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchTimetable();
//   }, [user]);

//   const handleCancel = async (classId) => {
//     try {
//       const response = await fetch('http://localhost:3000/api/timetable/cancel-class', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ classId }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to cancel class');
//       }

//       await fetchTimetable(); // Immediate refresh
//     } catch (error) {
//       setError(error.message);
//     }
//   };

//   const handlePostpone = async (classId) => {
//     try {
//       setSelectedClass(classId);
//       setError(null);  // Clear any previous errors
      
//       // First get the class details to know what time slot we're looking for
//       const classResponse = await fetch(`http://localhost:3000/api/timetable/class/${classId}`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       if (!classResponse.ok) {
//         throw new Error('Failed to get class details');
//       }
      
//       const classDetails = await classResponse.json();

//       // Then get available rooms
//       const roomsResponse = await fetch('http://localhost:3000/api/timetable/available-rooms', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           date: new Date().toISOString().split('T')[0], // Current date as default
//           startTime: classDetails[0].start_time,
//           endTime: classDetails[0].end_time,
//         }),
//       });
    

//       if (!roomsResponse.ok) {
//         throw new Error('Failed to get available rooms');
//       }
      
//       const rooms = await roomsResponse.json();
//       if (rooms.length === 0) {
//         alert('No rooms available for the selected time slot.');
//         return;
//       }
//       setAvailableRooms(rooms);
      
//       // Set initial values for the new schedule
//       setNewSchedule({
//         date: new Date().toISOString().split('T')[0],
//         startTime: classDetails[0].start_time.slice(0, 5),
//         endTime: classDetails[0].end_time.slice(0, 5),
//         classroomId: '',
//       });
//     } catch (error) {
//       console.error('Error in handlePostpone:', error);
//       setError(error.message);
//     }
//   };
  
//   const confirmPostpone = async () => {
//     try {
//       setScheduleError(null);

//       if (!newSchedule.date || !newSchedule.startTime || !newSchedule.endTime || !newSchedule.classroomId) {
//         throw new Error('Please fill in all fields');
//       }
  
//       const response = await fetch('http://localhost:3000/api/timetable/postpone-class', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           classId: selectedClass,
//           newDate: newSchedule.date,
//           newStartTime: newSchedule.startTime,
//           newEndTime: newSchedule.endTime,
//           newClassroomId: newSchedule.classroomId,
//           validUntil: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0] // One week from now
//         }),
//       });
  
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to postpone class');
//       }
  
//       // Reset states and refresh timetable
//       setSelectedClass(null);
//       setNewSchedule({
//         date: '',
//         startTime: '',
//         endTime: '',
//         classroomId: ''
//       });
//       await fetchTimetable();
//     } catch (error) {
//       console.error('Error in confirmPostpone:', error);
//       setError(error.message);
//       setScheduleError(error.message);

//     }
//   };


//   const groupByDay = (classes) => {
//     const groupedClasses = classes.reduce((acc, cls) => {
//       // Determine the day for the class
//       let day;
//       if (cls.modification_type === 'postponed' && cls.new_date) {
//         // For postponed classes, use the new date
//         const newDate = new Date(cls.new_date);
//         day = newDate.getDay(); // getDay() returns 0-6 (Sun-Sat)
//       } else {
//         // For regular and cancelled classes, use day_of_week
//         day = cls.day_of_week;
//       }

//       // Adjust day to match our days array (0-6 to 1-7)
//       day = day === 0 ? 7 : day;

//       if (!acc[day]) acc[day] = [];
//       acc[day].push(cls);
//       return acc;
//     }, {});

//     return groupedClasses;
//   };

//   // Adjusted days array to match database days (1-7, Mon-Sun)
//   const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//   const groupedTimetable = groupByDay(timetable);

//   const formatTime = (timeString) => {
//     try {
//       // Handle both date-time strings and time-only strings
//       const time = timeString.includes('T') 
//         ? new Date(timeString)
//         : new Date(`2000-01-01T${timeString}`);
      
//       return time.toLocaleTimeString([], { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: true 
//       });
//     } catch (err) {
//       console.error('Error formatting time:', err);
//       return timeString; // Return original string if parsing fails
//     }
//   };

//   if (error) {
//     return (
//       <div className="p-4 text-red-500">
//         Error loading timetable: {error}
//       </div>
//     );
//   }

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//       className="container mx-auto p-4 bg-neutral-900 min-h-screen"
//     >
//       <div className="relative">
//         {/* Decorative blurred background elements */}
//         <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl z-0"></div>
//         <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl z-0"></div>

//         <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
//           Timetable
//         </h2>

//         <div className="space-y-4 relative z-10">
//           {days.map((day, index) => (
//             <motion.div 
//               key={day}
//               whileHover={{ scale: 1.02 }}
//               transition={{ type: "spring", stiffness: 200 }}
//               className="border rounded-lg p-4 bg-neutral-800 border-purple-600/30 hover:border-blue-600/50 transition-all duration-300"
//             >
//               <h3 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
//                 {day}
//               </h3>
//               <div className="space-y-2">
//                 {groupedTimetable[index + 1]?.map((cls) => (
//                   <motion.div
//                     key={cls.id}
//                     whileHover={{ scale: 1.03 }}
//                     className={`p-4 rounded-lg transition-all duration-300 ${
//                       cls.modification_type === 'cancelled'
//                         ? 'bg-rose-900/30 text-rose-300 border border-rose-600/30'
//                         : cls.modification_type === 'postponed'
//                         ? 'bg-lime-900/30 text-lime-300 border border-lime-600/30'
//                         : 'bg-neutral-700 border border-neutral-600'
//                     }`}
//                   >
//                     {/* Class details with enhanced styling */}
//                     <div className="flex justify-between items-center">
//                       <div>
//                         <p className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
//                           {cls.course_name}
//                         </p>
//                         {/* Rest of the class details with similar styling */}
//                       </div>
//                       {/* Action buttons with neon effects */}
//                       {user.role === 'professor' && !cls.modification_type && (
//                         <div className="space-x-2">
//                           <motion.button
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.95 }}
//                             onClick={() => handleCancel(cls.id)}
//                             className="px-3 py-1 bg-red-600/30 text-red-400 rounded-md border border-red-600/30 hover:bg-red-600/50 transition-all duration-300"
//                           >
//                             Cancel
//                           </motion.button>
//                           <motion.button
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.95 }}
//                             onClick={() => handlePostpone(cls.id)}
//                             className="px-3 py-1 bg-yellow-600/30 text-yellow-400 rounded-md border border-yellow-600/30 hover:bg-yellow-600/50 transition-all duration-300"
//                           >
//                             Postpone
//                           </motion.button>
//                         </div>
//                       )}
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </div>

//       {/* Postpone Modal with Neon Effects */}
//       <AnimatePresence>
//         {selectedClass && (
//           <motion.div 
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
//           >
//             <motion.div 
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               className="bg-neutral-800 p-6 rounded-2xl max-w-md w-full border border-purple-600/30 shadow-neon relative overflow-hidden"
//             >
//               {/* Blurred background elements */}
//               <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-600/30 rounded-full blur-2xl"></div>
//               <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-600/30 rounded-full blur-2xl"></div>

//               <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
//                 Postpone Class
//               </h3>

//               {/* Rest of the modal content with similar styling */}
//               {/* ... */}
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// // Other components (ProtectedRoute, Navbar, NotFound, LandingPage) remain the same...


// // Protected Route Component
// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
  
//   if (loading) {
//     return <div>Loading...</div>;
//   }
  
//   if (!user) {
//     return <Navigate to="/login" />;
//   }
  
//   return children;
// };

// // Navigation Component
// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <nav className="bg-neutral-900 text-white p-4 shadow-lg border-b border-purple-600/30">
//       <div className="container mx-auto flex justify-between items-center">
//         <motion.div 
//           whileHover={{ scale: 1.05 }}
//           transition={{ type: "spring", stiffness: 300 }}
//         >
//           <Link 
//             to="/timetable" 
//             className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
//           >
//             Timetable System
//           </Link>
//         </motion.div>
//         <div className="space-x-4 flex items-center">
//           {user ? (
//             <>
//               <motion.span 
//                 className="text-purple-300"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//               >
//                 Welcome, {user.username}
//               </motion.span>
//               <motion.button
//                 onClick={handleLogout}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.95 }}
//                 className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-300 ease-in-out transform hover:shadow-neon"
//               >
//                 Logout
//               </motion.button>
//             </>
//           ) : (
//             <>
//               <Link 
//                 to="/login" 
//                 className="text-purple-300 hover:text-purple-500 transition-colors duration-300"
//               >
//                 Login
//               </Link>
//               <Link 
//                 to="/register" 
//                 className="text-blue-300 hover:text-blue-500 transition-colors duration-300"
//               >
//                 Register
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// // Existing Timetable component remains the same...

// // NotFound Component
// const NotFound = () => {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="text-center">
//         <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
//         <p className="text-gray-600 mb-4">Page not found</p>
//         <Link to="/timetable" className="text-blue-600 hover:text-blue-700">
//           Go to Timetable
//         </Link>
//       </div>
//     </div>
//   );
// };

// // Landing Page Component
// const LandingPage = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (user) {
//       navigate('/timetable');
//     }
//   }, [user, navigate]);

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
//       <div className="text-center max-w-2xl px-4">
//         <h1 className="text-4xl font-bold text-gray-800 mb-6">
//           Welcome to the Timetable Management System
//         </h1>
//         <p className="text-gray-600 mb-8">
//           Efficiently manage your class schedules, track modifications, and stay updated with your academic calendar.
//         </p>
//         <div className="space-x-4">
//           <Link
//             to="/login"
//             className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//           >
//             Login
//           </Link>
//           <Link
//             to="/register"
//             className="px-6 py-3 bg-white text-blue-600 rounded-md border border-blue-600 hover:bg-blue-50"
//           >
//             Register
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// const App = () => {
//   return (
//     <AuthProvider>
//       <div className="min-h-screen bg-neutral-900 text-white">
//         <Navbar />
//         <AnimatePresence mode="wait">
//           <Routes>
//             <Route path="/" element={<LandingPage />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//             <Route
//               path="/timetable"
//               element={
//                 <ProtectedRoute>
//                   <Timetable />
//                 </ProtectedRoute>
//               }
//             />
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </AnimatePresence>
//       </div>
//     </AuthProvider>
//   );
// };

// export default App;

