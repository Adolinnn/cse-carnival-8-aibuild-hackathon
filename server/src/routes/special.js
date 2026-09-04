import { Router } from 'express';
import * as specialController from '../controllers/specialController.js';

const r = Router();

// Rooms & Bookings
r.get('/rooms/available', specialController.getAvailableRooms);
r.get('/rooms/:room_number/full', specialController.getRoomFull);
r.get('/rooms/:room_number/bookings', specialController.getRoomBookings);
r.post('/rooms/:room_number/bookings', specialController.bookRoom);
r.delete('/bookings/:booking_id', specialController.cancelBooking);

// Events & Registrations
r.get('/events/:id/registrations', specialController.getEventRegistrations);
r.post('/events/:id/registrations', specialController.registerForEvent);
r.delete('/events/:id/registrations/:student_id', specialController.cancelRegistration);

export default r;
