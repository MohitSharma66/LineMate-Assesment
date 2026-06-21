import { CheckCircle, Clock, Shield, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TestLeaderDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/admin-requests/pending');
      setRequests(response.data.requests || []);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Only test leaders can access this page');
        navigate('/events');
      } else {
        toast.error('Failed to fetch pending requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (userId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this admin request?`)) return;

    setProcessing(userId);
    try {
      const response = await api.put(`/admin-requests/review/${userId}`, {
        action,
        notes: action === 'approve' ? 'Approved by test leader' : 'Denied by test leader'
      });
      toast.success(response.data.message);
      fetchPendingRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Leader Dashboard</h1>
          <p className="text-gray-600 mt-1">Review and manage admin access requests</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-700">{requests.length} Pending Requests</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h2>
          <p className="text-gray-600">All admin requests have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {request.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      Requested: {new Date(request.adminRequest.requestedAt).toLocaleString()}
                    </div>
                    {request.adminRequest.secretPhrase && (
                      <div className="flex items-center text-gray-500">
                        <Shield className="w-4 h-4 mr-1" />
                        Secret: <span className="font-mono ml-1">{request.adminRequest.secretPhrase}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                  <button
                    onClick={() => handleReview(request._id, 'approve')}
                    disabled={processing === request._id}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {processing === request._id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReview(request._id, 'deny')}
                    disabled={processing === request._id}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {processing === request._id ? 'Processing...' : 'Deny'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestLeaderDashboard;