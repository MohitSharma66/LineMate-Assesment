import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import SeatSelector from '../components/SeatSelector';
import api from '../services/api';
import socketService from '../services/socket';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [waitlistStatus, setWaitlistStatus] = useState(null);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSeats, setWaitlistSeats] = useState(1);

  useEffect(() => {
    fetchEvent();
    fetchWaitlistStatus();
    socketService.joinEvent(id);
    socketService.onSeatsUpdated((data) => {
      if (data.eventId === id) {
        setEvent(prev => prev ? { ...prev, availableSeats: data.availableSeats } : prev);
        if (data.bookedSeats) {
          setBookedSeats(data.bookedSeats);
        }
      }
    });
    return () => {
      socketService.leaveEvent(id);
      socketService.off('seats-updated');
    };
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
      setBookedSeats(response.data.bookedSeats || []);
    } catch (error) {
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlistStatus = async () => {
    try {
      const response = await api.get(`/waitlist/${id}/status`);
      setWaitlistStatus(response.data);
    } catch (error) {
      setWaitlistStatus({ isWaitlisted: false });
    }
  };

  const handleBooking = async () => {
    const count = selectedSeats.length;
    if (count === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    if (count > event.availableSeats) {
      toast.error(`Only ${event.availableSeats} seats available`);
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.post('/bookings', { 
        eventId: id, 
        numberOfSeats: count,
        seatLabels: selectedSeats
      });
      
      toast.success(`Booking confirmed! Seats: ${selectedSeats.join(', ')}`);
      setShowSeatSelector(false);
      setSelectedSeats([]);
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.waitlisted) {
        toast.success(`Added to waitlist! Position: ${errData.position || 'unknown'}`);
        fetchWaitlistStatus();
        setEvent(prev => ({ ...prev, availableSeats: 0 }));
      } else {
        toast.error(errData?.message || 'Booking failed');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSeatSelection = (seats) => {
    setSelectedSeats(seats);
  };

  const handleJoinWaitlist = async () => {
    const seats = parseInt(waitlistSeats) || 1;
    if (seats < 1) {
      toast.error('Please select at least 1 seat');
      return;
    }

    setWaitlistLoading(true);
    try {
      const response = await api.post('/bookings', {
        eventId: id,
        numberOfSeats: seats,
        seatLabels: []
      });
      
      if (response.data.waitlisted) {
        toast.success(`Added to waitlist! Position: ${response.data.position}`);
        fetchWaitlistStatus();
        setEvent(prev => ({ ...prev, availableSeats: 0 }));
      } else {
        toast.success('Booking confirmed!');
        navigate('/bookings');
      }
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.waitlisted) {
        toast.success(`Added to waitlist! Position: ${errData.position || 'unknown'}`);
        fetchWaitlistStatus();
        setEvent(prev => ({ ...prev, availableSeats: 0 }));
      } else {
        toast.error(errData?.message || 'Failed to join waitlist');
      }
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    try {
      await api.delete(`/waitlist/${id}/leave`);
      toast.success('Removed from waitlist');
      setWaitlistStatus({ isWaitlisted: false });
      fetchEvent();
    } catch (error) {
      toast.error('Failed to leave waitlist');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Events
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>
          <p className="text-gray-600 text-lg mb-6">{event.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                <span>{format(new Date(event.date), 'PPP')}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="w-5 h-5 mr-3 text-blue-600" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Users className="w-5 h-5 mr-3 text-blue-600" />
                <span>{event.availableSeats} / {event.totalSeats} seats available</span>
              </div>
              <div className="flex items-center text-gray-700">
                <User className="w-5 h-5 mr-3 text-blue-600" />
                <span>Organizer: {event.createdBy?.name || 'Unknown'}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              {event.availableSeats > 0 ? (
                <>
                  {!showSeatSelector ? (
                    <button
                      onClick={() => setShowSeatSelector(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Select Seats
                    </button>
                  ) : (
                    <div>
                      <SeatSelector
                        totalSeats={event.totalSeats}
                        bookedSeats={bookedSeats}
                        onSeatsChange={handleSeatSelection}
                      />
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => {
                            setShowSeatSelector(false);
                            setSelectedSeats([]);
                          }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBooking}
                          disabled={bookingLoading || selectedSeats.length === 0}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {bookingLoading ? 'Booking...' : `Book ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}`}
                        </button>
                      </div>
                      {selectedSeats.length > 0 && (
                        <p className="mt-2 text-center text-sm text-gray-600">
                          Selected: <span className="font-medium text-blue-600">{selectedSeats.join(', ')}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-red-600 font-medium">Fully Booked!</p>
                  
                  {waitlistStatus?.isWaitlisted ? (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        You're on the waitlist (Position: {waitlistStatus.position || 'unknown'})
                        <br />
                        <span className="text-xs text-gray-500">
                          Requested {waitlistStatus.waitlistEntry?.numberOfSeats || 1} seat(s)
                        </span>
                      </p>
                      <button
                        onClick={handleLeaveWaitlist}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Leave Waitlist
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of seats to waitlist for:
                      </label>
                      <div className="flex items-center gap-3 justify-center">
                        <button
                          onClick={() => setWaitlistSeats(Math.max(1, waitlistSeats - 1))}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold text-gray-800 w-12 text-center">
                          {waitlistSeats}
                        </span>
                        <button
                          onClick={() => setWaitlistSeats(waitlistSeats + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={handleJoinWaitlist}
                        disabled={waitlistLoading}
                        className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {waitlistLoading ? 'Joining...' : `Join Waitlist (${waitlistSeats} seat${waitlistSeats > 1 ? 's' : ''})`}
                      </button>
                    </div>
                  )}
                  
                  {waitlistStatus?.totalWaiting > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {waitlistStatus.totalWaiting} people on waitlist
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;