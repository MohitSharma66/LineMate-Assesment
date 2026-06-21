import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const VerifyBooking = () => {
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.get(`/events/verify/${bookingId}`);
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired ticket');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Ticket</h2>
          <p className="text-gray-600">{error || 'This ticket is not valid or has been cancelled.'}</p>
          <Link to="/" className="mt-6 inline-block text-blue-600 hover:text-blue-700">
            ← Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const { booking } = data;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center text-white">
            <CheckCircle className="w-8 h-8 mr-2" />
            <span className="font-bold text-lg">Valid Ticket</span>
          </div>
          <span className="text-white text-sm bg-green-700 px-3 py-1 rounded-full">✓ Verified</span>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.eventName}</h2>
          <p className="text-gray-600 mb-6">Ticket for {booking.user}</p>

          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <Calendar className="w-5 h-5 mr-3 text-blue-600" />
              <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="w-5 h-5 mr-3 text-blue-600" />
              <span>{booking.eventTime}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="w-5 h-5 mr-3 text-blue-600" />
              <span>{booking.venue}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <User className="w-5 h-5 mr-3 text-blue-600" />
              <span>{booking.user}</span>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Seats</p>
            <p className="font-semibold text-lg">{booking.seats}</p>
          </div>

          <div className="mt-8 flex justify-between items-center border-t pt-4">
            <Link to="/" className="text-blue-600 hover:text-blue-700 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Home
            </Link>
            <span className="text-sm text-gray-400">Booking ID: {bookingId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyBooking;