import { Calendar, Clock, LayoutDashboard, LogOut, Shield, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navbar on login/register pages
  if (window.location.pathname === '/login' || window.location.pathname === '/register') {
    return null;
  }

  // Determine if user is regular (not admin or test_leader)
  const isRegularUser = user && user.role !== 'admin' && user.role !== 'test_leader';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link 
            to={
              user?.role === 'admin' ? '/admin' : 
              user?.role === 'test_leader' ? '/test-leader' : 
              '/events'
            } 
            className="flex items-center space-x-2"
          >
            <Calendar className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">EventBook</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Regular user links (includes 'user' role and any undefined role) */}
                {isRegularUser && (
                  <>
                    <Link to="/events" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                      Events
                    </Link>
                    <Link to="/bookings" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                      My Bookings
                    </Link>
                    {user.adminRequest?.status !== 'pending' && user.adminRequest?.status !== 'approved' && (
                      <Link to="/request-admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Request Admin
                      </Link>
                    )}
                    {user.adminRequest?.status === 'pending' && (
                      <span className="text-yellow-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Admin Pending
                      </span>
                    )}
                  </>
                )}

                {/* Admin links */}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    Dashboard
                  </Link>
                )}

                {/* Test Leader links */}
                {user.role === 'test_leader' && (
                  <Link to="/test-leader" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Pending Requests
                  </Link>
                )}

                {/* User Menu */}
                <div className="flex items-center space-x-2 border-l pl-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                      {user.name}
                    </span>
                    {user.role === 'admin' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hidden sm:inline">
                        Admin
                      </span>
                    )}
                    {user.role === 'test_leader' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full hidden sm:inline">
                        Test Leader
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;