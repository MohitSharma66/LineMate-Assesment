import { CheckCircle, Clock, Key, Shield, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RequestAdmin = () => {
  const [secretPhrase, setSecretPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  // Prevent infinite loops
  const hasRefreshed = useRef(false);

  useEffect(() => {
    fetchStatus();
    fetchUser();
  }, []);

  // Watch for approval - only run once
  useEffect(() => {
    if (requestStatus?.status === 'approved' && !hasRefreshed.current) {
      hasRefreshed.current = true; // Prevent multiple runs
      
      const refreshAndRedirect = async () => {
        toast.loading('Refreshing admin privileges...');
        const updatedUser = await refreshUser();
        toast.dismiss();
        
        if (updatedUser?.role === 'admin') {
          toast.success('Admin privileges activated! 🎉');
          setTimeout(() => navigate('/admin'), 1500);
        } else {
          toast.error('Failed to refresh privileges. Please refresh the page.');
          hasRefreshed.current = false; // Reset so user can retry
        }
      };
      refreshAndRedirect();
    }
  }, [requestStatus, refreshUser, navigate]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      if (response.data.user.role === 'admin') {
        toast.success('You are already an admin!');
        navigate('/admin');
      }
      if (response.data.user.role === 'test_leader') {
        toast.success('You are a test leader!');
        navigate('/test-leader');
      }
    } catch (error) {
      toast.error('Failed to fetch user info');
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await api.get('/admin-requests/status');
      setRequestStatus(response.data);
    } catch (error) {
      setRequestStatus({ status: 'none' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretPhrase.trim()) {
      toast.error('Please enter the secret phrase');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin-requests/request', {
        secretPhrase: secretPhrase.trim()
      });
      toast.success(response.data.message);
      fetchStatus();
      setSecretPhrase('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    if (!requestStatus) return null;

    switch (requestStatus.status) {
      case 'pending':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-800">⏳ Request Pending</h3>
                <p className="text-sm text-yellow-700">
                  Your admin request is waiting for approval from the test leader.
                  <br />
                  Submitted: {new Date(requestStatus.requestedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'approved':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-green-800">✅ Admin Access Approved!</h3>
                <p className="text-sm text-green-700">
                  You now have admin privileges! Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'denied':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="font-semibold text-red-800">❌ Request Denied</h3>
                <p className="text-sm text-red-700">
                  Your admin request was denied. 
                  {requestStatus.notes && <br />}
                  {requestStatus.notes && `Reason: ${requestStatus.notes}`}
                  <br />
                  You can try again in 24 hours.
                </p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Request Admin Access</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the secret phrase provided by the test leader to request admin privileges.
          </p>
        </div>

        {renderStatus()}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="secretPhrase" className="block text-sm font-medium text-gray-700 mb-1">
              Secret Phrase
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="secretPhrase"
                type="text"
                value={secretPhrase}
                onChange={(e) => setSecretPhrase(e.target.value)}
                placeholder="Enter the admin secret phrase"
                disabled={requestStatus?.status === 'pending' || requestStatus?.status === 'approved'}
                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              💡 The test leader will provide this phrase. Contact them if you don't have it.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || requestStatus?.status === 'pending' || requestStatus?.status === 'approved'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : requestStatus?.status === 'pending' ? (
              '⏳ Request Pending'
            ) : requestStatus?.status === 'approved' ? (
              '✅ Already Admin'
            ) : (
              'Submit Request'
            )}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={() => navigate('/events')}
            className="text-sm text-blue-600 hover:text-blue-700 block w-full"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestAdmin;