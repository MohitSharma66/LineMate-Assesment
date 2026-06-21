import { format } from 'date-fns';
import { Calendar, Clock, MapPin, QrCode, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">You have no bookings yet.</p>
          <Link to="/events" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6 flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{booking.event.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{booking.event.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(booking.event.date), 'PPP')}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-2" />
                      {booking.event.time}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <MapPin className="w-4 h-4 mr-2" />
                      {booking.event.venue}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      Seats: {booking.numberOfSeats}
                    </div>
                  </div>
                  {booking.qrCode && (
                    <button
                      onClick={() => setShowQR(showQR === booking._id ? null : booking._id)}
                      className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      {showQR === booking._id ? 'Hide QR Code' : 'Show QR Code'}
                    </button>
                  )}
                  {showQR === booking._id && booking.qrCode && (
                    <div className="mt-2">
                      <img src={booking.qrCode} alt="QR Code" className="w-32 h-32" />
                    </div>
                  )}
                </div>
                <div className="mt-4 md:mt-0 flex flex-col items-end">
                  <span className="text-sm text-gray-500">Booked on {format(new Date(booking.bookingDate), 'PPP')}</span>
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
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

export default MyBookings;