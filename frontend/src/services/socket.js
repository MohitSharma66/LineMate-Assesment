import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL.replace('/api', '');

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket && this.connected) return;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinEvent(eventId) {
    if (this.socket && this.connected) {
      this.socket.emit('join-event', eventId);
    }
  }

  leaveEvent(eventId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave-event', eventId);
    }
  }

  joinUser(userId) {
    if (this.socket && this.connected) {
      this.socket.emit('join-user', userId);
    }
  }

  onSeatsUpdated(callback) {
    if (this.socket) {
      this.socket.on('seats-updated', callback);
    }
  }

  onBookingConfirmed(callback) {
    if (this.socket) {
      this.socket.on('booking-confirmed', callback);
    }
  }

  onWaitlistFulfilled(callback) {
    if (this.socket) {
      this.socket.on('waitlist-fulfilled', callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();