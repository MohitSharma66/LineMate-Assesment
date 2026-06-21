import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute'; // We'll create this
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import EventDetail from './pages/EventDetail';
import Events from './pages/Events';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import OAuthRedirect from './pages/OAuthRedirect';
import Register from './pages/Register';
import RequestAdmin from './pages/RequestAdmin';
import TestLeaderDashboard from './pages/TestLeaderDashboard';
import VerifyBooking from './pages/VerifyBooking';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/events" />} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/oauth-redirect" element={<OAuthRedirect />} />
          <Route path="/request-admin" element={<ProtectedRoute><RequestAdmin /></ProtectedRoute>} />
          <Route path="/test-leader" element={<ProtectedRoute><TestLeaderDashboard /></ProtectedRoute>} />
          <Route path="/verify/:bookingId" element={<VerifyBooking />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;