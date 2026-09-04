import React, { useState } from 'react';
import {
  DoorOpen,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Plus,
  Tv,
  Wifi,
  Users,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService } from '../../services/dataService';

export const RoomsView = ({ rooms, session, simulatedDate }) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const role = activeSession?.role || 'student';
  const tenant = activeSession || { dept: 'CSE', semester: '3.2', section: 'A' };

  const [selectedWing, setSelectedWing] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [minCapacity, setMinCapacity] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  // Booking Modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDate, setBookingDate] = useState(simulatedDate || '2026-09-10');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [purpose, setPurpose] = useState('Group Study / Project Work');

  const filteredRooms = (rooms || []).filter((r) => {
    const wing = r.room_number?.charAt(1);
    const matchesWing = selectedWing === 'All' || wing === selectedWing;
    const matchesType = selectedType === 'All' || r.type === selectedType;
    const matchesCap = r.capacity >= minCapacity;
    const matchesSearch =
      r.room_number?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.equipment || []).some((eq) => eq.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesWing && matchesType && matchesCap && matchesSearch;
  });

  const handleOpenBooking = (room) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const res = dataService.bookRoom(
      selectedRoom.room_number,
      {
        date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        purpose,
        booked_by: `${tenant.dept} ${tenant.semester} (Sec ${tenant.section}) - ${role}`,
      },
      tenant,
      role
    );

    if (res.success) {
      showToast(res.message, 'success');
      setIsBookingOpen(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCancelBooking = (roomNumber, bookingId) => {
    const res = dataService.cancelRoomBooking(roomNumber, bookingId, tenant, role);
    if (res.success) {
      showToast(res.message, 'info');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Campus Rooms & Facilities
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              Global Shared Infrastructure
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Physical rooms are shared across all sections. Bookings are verified cross-tenant to prevent conflicts.
          </p>
        </div>
      </div>

      {/* Admin Action Banner */}
      {isAdmin && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Admin Mode Active: Full privileges to book campus facilities, override reservations, or cancel active bookings.
            </span>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30 shrink-0">
            Cross-Tenant Conflict Detection Active
          </span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Wings */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Wing:</span>
          {['All', 'A', 'B', 'C'].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWing(w)}
              className={'px-3 py-1 rounded-xl text-xs font-bold transition-colors ' +
                (selectedWing === w
                  ? 'bg-[#C5BAFF] text-indigo-950 dark:bg-campus-600 dark:text-white'
                  : 'bg-[#E8F9FF] text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-[#C4D9FF]')
              }
            >
              {w === 'All' ? 'All Wings' : 'Wing ' + w}
            </button>
          ))}
        </div>

        {/* Room Types */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Type:</span>
          {['All', 'classroom', 'lab', 'seminar'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={'px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors ' +
                (selectedType === t
                  ? 'bg-[#C5BAFF] text-indigo-950 dark:bg-campus-600 dark:text-white'
                  : 'bg-[#E8F9FF] text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-[#C4D9FF]')
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search room or equipment..."
            className="pl-8 pr-3 py-1 text-xs rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const isAvail = room.status === 'available';
          const bookings = room.bookings || [];

          return (
            <div
              key={room.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    Room {room.room_number}
                  </span>
                  <span className={'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ' +
                    (isAvail
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20')
                  }>
                    {room.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="capitalize font-medium text-slate-800 dark:text-slate-300">{room.type}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    Cap: {room.capacity}
                  </span>
                  <span>·</span>
                  <span>Floor {room.floor}</span>
                </div>

                {/* Equipment Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(room.equipment || []).map((eq, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#E8F9FF] dark:bg-slate-950 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-[#C4D9FF] dark:border-slate-800"
                    >
                      {eq}
                    </span>
                  ))}
                </div>

                {/* Active Bookings List */}
                {bookings.length > 0 && (
                  <div className="pt-2 border-t border-[#C4D9FF]/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Reserved Bookings ({bookings.length}):
                    </span>
                    {bookings.slice(0, 2).map((b) => (
                      <div
                        key={b.booking_id}
                        className="p-1.5 rounded-lg bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF]/60 dark:border-slate-800 text-[10px] flex items-center justify-between"
                      >
                        <div className="truncate pr-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{b.date}</span> ({b.start_time}-{b.end_time})
                          <div className="text-slate-500 truncate">{b.booked_by}</div>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(room.room_number, b.booking_id)}
                          className="text-[9px] text-rose-600 hover:underline shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Book Room Button */}
              <button
                onClick={() => handleOpenBooking(room)}
                className="w-full py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-md shadow-campus-600/20 transition-colors"
              >
                Book Room {room.room_number}
              </button>
            </div>
          );
        })}
      </div>

      {/* Book Room Modal */}
      <Modal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={'Reserve Room ' + (selectedRoom?.room_number || '')}
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#E8F9FF] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            Booking on behalf of: <strong>{tenant.dept} {tenant.semester} (Sec {tenant.section})</strong> · {role === 'admin' ? 'Admin' : 'Student'}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Group presentation practice"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#C4D9FF] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBookingOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
