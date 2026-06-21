# 🎫 Event Booking System

> **Live Demo:** [https://your-deployed-link.com](https://your-deployed-link.com)

A full-stack event booking platform built as an internship assessment. Users can browse events, book seats with a cinema-style seat selector, manage bookings, and join waitlists for fully-booked events. The system includes role-based access control, QR code ticket generation, real-time seat updates, and email notifications.

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database and ODM |
| JWT | Authentication |
| Passport.js | Google OAuth integration |
| Socket.io | Real-time seat updates |
| Resend | Email notifications |
| QRCode | QR code generation |
| express-validator | Input validation |
| express-rate-limit | Rate limiting |
| helmet | Security headers |
| sanitize-html | XSS protection |

### Frontend
| Technology | Purpose |
|---|---|
| React.js | UI framework |
| React Router | Navigation |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| Axios | HTTP client |
| Socket.io-client | Real-time updates |
| date-fns | Date formatting |
| react-hot-toast | Toast notifications |

---

## 🎯 Core Features

### 1. Authentication & Authorization

- Email/password registration and login with bcrypt password hashing
- Google OAuth login via Passport.js
- JWT tokens (expire after 7 days)

**Role-Based Access Control:**
| Role | Permissions |
|---|---|
| User | Browse events, book seats, view bookings, request admin access |
| Admin | Create events, view dashboard, see registrations, approve users |
| Test Leader | Approve/deny admin access requests |

### 2. Admin Approval Workflow

1. User requests admin access and enters a secret phrase (set in `.env`)
2. Request is submitted with status `pending`
3. Test Leader approves or denies from their dashboard
4. Approved users get the `admin` role; denied users must wait 24 hours before retrying

### 3. Event Management

**Users** can browse events, view details, and see real-time seat availability.

**Admins** can create events via a modal form and view an admin dashboard showing total events, total registrations, and upcoming event counts.

### 4. Cinema-Style Seat Booking

- Seats displayed in a grid (10 per row) with labels like `A-1`, `A-2`, `B-1`, etc.
- Color coding: **White** = Available, **Blue** = Selected, **Gray** = Booked
- Stage displayed at the top of the seat map
- Selected seat labels are sent to the backend on confirmation

### 5. Booking System

- Atomic availability checks prevent double-booking
- Each booking stores the user, event, number of seats, specific seat labels, and a QR code
- Users can view and cancel bookings from the "My Bookings" page
- Cancellation releases seats back to inventory and triggers waitlist processing

### 6. Waitlist System

When an event is fully booked, users can join the waitlist with a seat count selector. When someone cancels:

1. Seats are released back to inventory
2. The oldest waitlist entry is checked
3. Seats are assigned and a booking is created automatically
4. The waitlisted user receives an email notification

### 7. QR Code Tickets

- Generated on booking creation; stored as Base64 in the booking record
- QR code links to `/verify/[bookingId]`
- Verification page shows full ticket details (event, date, venue, user, seats) or an "Invalid Ticket" message

### 8. Real-Time Updates (WebSocket)

Users on the event detail page are joined to a WebSocket room (`event-[eventId]`). Seat availability updates instantly for all users in the room when a booking or cancellation occurs — no page refresh needed.

### 9. Email Notifications

| Email | Trigger |
|---|---|
| Booking Confirmation | Seat booking confirmed — includes seat labels |
| Waitlist Notification | Waitlisted user gets a seat — includes assigned labels |
| Cancellation Confirmation | Booking cancelled — includes released seat labels |

> **Note:** Currently using Resend's sandbox mode (`onboarding@resend.dev`). Emails are only delivered to the Resend account owner's address. To send to any user, verify a domain in the Resend dashboard.

### 10. Security

| Feature | Implementation |
|---|---|
| Password Hashing | bcrypt with salt rounds |
| JWT Auth | Tokens expire after 7 days |
| Input Validation | express-validator on all routes |
| Input Sanitization | sanitize-html to prevent XSS |
| Rate Limiting | 100 req/15 min (general), 20/hour (bookings) |
| CORS | Configured for specific origins only |
| Security Headers | helmet |
| Concurrency Control | Atomic DB operations prevent double-booking |

---

## 📂 Folder Structure

```
event-booking-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Passport, database config
│   │   ├── controllers/     # Business logic
│   │   │   ├── authController.js
│   │   │   ├── eventController.js
│   │   │   ├── bookingController.js
│   │   │   ├── adminController.js
│   │   │   ├── adminRequestController.js
│   │   │   └── waitlistController.js
│   │   ├── middleware/      # Auth, rate limiting, sanitization
│   │   ├── models/          # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Event.js
│   │   │   ├── Booking.js
│   │   │   └── Waitlist.js
│   │   ├── routes/          # API routes
│   │   ├── services/        # Email, QR, seat utilities
│   │   └── seed.js          # Database seeder
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (Auth)
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Events.js
│   │   │   ├── EventDetail.js
│   │   │   ├── MyBookings.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── RequestAdmin.js
│   │   │   ├── TestLeaderDashboard.js
│   │   │   └── VerifyBooking.js
│   │   ├── services/        # API, Socket services
│   │   └── App.js
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 🗄️ Database Schema

**User**
```js
{
  name, email, password, googleId, role: 'user' | 'admin' | 'test_leader',
  adminRequest: { status, secretPhrase, requestedAt, reviewedAt, reviewedBy, notes },
  createdAt
}
```

**Event**
```js
{
  name, description, date, time, venue,
  totalSeats, availableSeats, bookedSeats: ['A-1', 'A-2', ...],
  createdBy, createdAt
}
```

**Booking**
```js
{
  user, event, numberOfSeats, seatLabels: ['A-1', 'A-2', ...],
  status: 'confirmed' | 'cancelled', bookingDate, cancelledAt, qrCode
}
```

**Waitlist**
```js
{
  user, event, numberOfSeats,
  status: 'waiting' | 'notified' | 'fulfilled',
  joinedAt, notifiedAt, fulfilledAt
}
```

---

## 🚀 Setup

### Prerequisites

- Node.js v14+
- MongoDB (local or Atlas)

### Environment Variables

**Backend `.env`**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event_booking
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

RESEND_API_KEY=re_your_api_key
EMAIL_FROM=onboarding@resend.dev

APP_URL=http://localhost:5000
ADMIN_SECRET_PHRASE=your-secret-phrase-here
```

**Frontend `.env`**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Installation

```bash
# Backend
cd backend
npm install
npm run seed
node src/fix-password.js   # Re-hashes seed passwords (required after seeding)
npm run dev

# Frontend
cd frontend
npm install
npm start
```

> ⚠️ `fix-password.js` must be run after seeding due to bcrypt differences. Without it, seed account logins will fail.

---

## 🧪 Testing Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Test Leader | leader@example.com | leader123 |

---

## 📱 Feature Test Guide

**Admin Approval Workflow**
1. Login as any user → Request Admin → enter secret phrase
2. Login as Test Leader → approve/deny from Pending Requests

**Cinema-Style Booking**
1. Login → go to an event with available seats → Select Seats → click seats → Book

**Waitlist**
1. Find a fully-booked event → use +/- to pick seat count → Join Waitlist

**QR Code**
1. Book seats → My Bookings → Show QR Code → scan with phone

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| Passwords don't work after seeding | Run `node src/fix-password.js` |
| MongoDB connection error | Check `MONGODB_URI` in `.env` |
| Google OAuth fails | Verify `GOOGLE_CALLBACK_URL` in Google Cloud Console |
| Email not sending | Check `RESEND_API_KEY` and your verified email |
| Seat selector not showing | Ensure event has `totalSeats > 0` |
| QR code shows JSON | Update `qrService.js` to use frontend URL |