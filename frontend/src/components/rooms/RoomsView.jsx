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
  Edit2,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService } from '../../services/dataService';

export const RoomsView = ({ rooms, session, simulatedDate, simulatedTime }) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const role = activeSession?.role || 'student';
  const tenant = activeSession || { dept: 'CSE', semester: '4.1', section: 'B' };

  const activeDate = simulatedDate || '2026-09-09';
  const activeTime = simulatedTime || '10:00';

  const [selectedWing, setSelectedWing] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All'); // 'All' | 'available' | 'occupied'
  const [searchFilter, setSearchFilter] = useState('');

  // Booking Modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDate, setBookingDate] = useState(activeDate);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [purpose, setPurpose] = useState('Group Study / Project Work');

  // Admin Add / Edit Room Modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null); // null = Add mode
  const [roomFormData, setRoomFormData] = useState({
    room_number: '',
    type: 'classroom',
    capacity: 40,
    equipment: 'whiteboard, projector, AC',
    floor: 7,
    status: 'available',
  });

  // Calculate dynamic room status relative to simulated clock
  const getRoomOccupancy = (room) => {
    if (room.status === 'unavailable') {
      return {
        isAvailable: false,
        label: 'Unavailable',
        color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        activeBooking: null,
      };
    }

    const bookings = room.bookings || [];
    // Check if occupied at exact simulated clock slot
    const activeNow = bookings.find(
      (b) => b.date === activeDate && b.start_time <= activeTime && b.end_time > activeTime
    );

    if (activeNow) {
      return {
        isAvailable: false,
        label: 'Occupied Now',
        color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        activeBooking: activeNow,
      };
    }

    // Check if booked anytime today
    const bookedToday = bookings.find((b) => b.date === activeDate);
    if (bookedToday) {
      return {
        isAvailable: true,
        isBookedToday: true,
        label: `Booked (${bookedToday.start_time}-${bookedToday.end_time})`,
        color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        activeBooking: bookedToday,
      };
    }

    return {
      isAvailable: true,
      label: 'Available',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      activeBooking: null,
    };
  };

  // Stats Counters
  const totalRoomsCount = (rooms || []).length;
  const availableNowCount = (rooms || []).filter((r) => {
    const occ = getRoomOccupancy(r);
    return occ.label !== 'Occupied Now' && occ.label !== 'Unavailable';
  }).length;
  const occupiedNowCount = totalRoomsCount - availableNowCount;
  const bookedTodayCount = (rooms || []).filter((r) =>
    (r.bookings || []).some((b) => b.date === activeDate)
  ).length;

  const filteredRooms = (rooms || []).filter((r) => {
    const wing = r.room_number?.charAt(1);
    const matchesWing = selectedWing === 'All' || wing === selectedWing;
    const matchesType = selectedType === 'All' || r.type === selectedType;
    
    const occ = getRoomOccupancy(r);
    const matchesAvailability =
      availabilityFilter === 'All' ||
      (availabilityFilter === 'available' && occ.isAvailable && occ.label !== 'Occupied Now') ||
      (availabilityFilter === 'occupied' && (!occ.isAvailable || occ.label === 'Occupied Now' || occ.isBookedToday));

    const matchesSearch =
      r.room_number?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.equipment || []).some((eq) => eq.toLowerCase().includes(searchFilter.toLowerCase()));

    return matchesWing && matchesType && matchesAvailability && matchesSearch;
  });

  // Booking handlers
  const handleOpenBooking = (room) => {
    setSelectedRoom(room);
    setBookingDate(activeDate);
    setStartTime('14:00');
    setEndTime('16:00');
    setIsBookingOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    // Strict 6am to 6pm limit
    if (startTime < '06:00' || endTime > '18:00') {
      showToast('Room bookings are only allowed between 6:00 AM and 6:00 PM.', 'error');
      return;
    }

    if (startTime >= endTime) {
      showToast('Start time must be earlier than end time.', 'error');
      return;
    }

    const res = await dataService.bookRoom(
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

  // Admin Room Management Handlers
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomFormData({
      room_number: '',
      type: 'classroom',
      capacity: 40,
      equipment: 'whiteboard, projector, AC',
      floor: 7,
      status: 'available',
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      room_number: room.room_number,
      type: room.type || 'classroom',
      capacity: room.capacity || 40,
      equipment: Array.isArray(room.equipment) ? room.equipment.join(', ') : (room.equipment || ''),
      floor: room.floor || 7,
      status: room.status || 'available',
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    if (!roomFormData.room_number.trim()) {
      showToast('Room number is required.', 'error');
      return;
    }

    const eqArray = roomFormData.equipment
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingRoom) {
        dataService.updateRoom(
          editingRoom.id || editingRoom._id,
          {
            ...roomFormData,
            equipment: eqArray,
            capacity: Number(roomFormData.capacity),
            floor: Number(roomFormData.floor),
          },
          role
        );
        showToast(`Room ${roomFormData.room_number} updated successfully!`, 'success');
      } else {
        dataService.addRoom(
          {
            ...roomFormData,
            equipment: eqArray,
            capacity: Number(roomFormData.capacity),
            floor: Number(roomFormData.floor),
          },
          role
        );
        showToast(`Room ${roomFormData.room_number} created successfully!`, 'success');
      }
      setIsRoomModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRoom = (room) => {
    if (!window.confirm(`Are you sure you want to delete Room ${room.room_number}?`)) return;
    try {
      dataService.deleteRoom(room.id || room._id, role);
      showToast(`Room ${room.room_number} deleted.`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
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
              Global Infrastructure
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Simulated Clock: <strong className="text-indigo-600 dark:text-indigo-400">{activeDate} at {activeTime}</strong>. Booking allowed strictly between 6:00 AM – 6:00 PM.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddRoom}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Room</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Wings */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Wing:</span>
          {['All', 'A', 'B', 'C'].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWing(w)}
              className={'px-3 py-1 rounded-xl text-xs font-bold transition-colors ' +
                (selectedWing === w
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#E8F9FF] text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-[#C4D9FF]')
              }
            >
              {w === 'All' ? 'All Wings' : 'Wing ' + w}
            </button>
          ))}
        </div>

        {/* Room Types */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Type:</span>
          {['All', 'classroom', 'lab', 'seminar'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={'px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors ' +
                (selectedType === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#E8F9FF] text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-[#C4D9FF]')
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
          {['All', 'available', 'occupied'].map((st) => (
            <button
              key={st}
              onClick={() => setAvailabilityFilter(st)}
              className={'px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors ' +
                (availabilityFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#E8F9FF] text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-[#C4D9FF]')
              }
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search room or equipment..."
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const occ = getRoomOccupancy(room);
          const bookings = room.bookings || [];

          return (
            <div
              key={room.id || room._id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    Room {room.room_number}
                  </span>
                  <span className={'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ' + occ.color}>
                    {occ.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="capitalize font-medium text-slate-800 dark:text-slate-300">{room.type}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
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
                    {bookings.slice(0, 3).map((b) => (
                      <div
                        key={b.booking_id || b._id}
                        className="p-1.5 rounded-lg bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF]/60 dark:border-slate-800 text-[10px] flex items-center justify-between gap-1"
                      >
                        <div className="truncate pr-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{b.date}</span> ({b.start_time}-{b.end_time})
                          <div className="text-slate-500 truncate">{b.booked_by}</div>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(room.room_number, b.booking_id || b._id)}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-700 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 shrink-0 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-2">
                <button
                  onClick={() => handleOpenBooking(room)}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Book Room {room.room_number}</span>
                </button>

                {isAdmin && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => handleOpenEditRoom(room)}
                      className="py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room)}
                      className="py-1.5 rounded-lg text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Book Room Modal (Strict 6 AM - 6 PM Limit) */}
      <Modal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={'Reserve Room ' + (selectedRoom?.room_number || '')}
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>University Operating Policy:</strong> Bookings permitted strictly between <strong>6:00 AM and 6:00 PM</strong> (06:00 – 18:00). Night bookings are disabled.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#E8F9FF] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            Booking as: <strong>{tenant.dept} {tenant.semester} (Sec {tenant.section})</strong> · {role === 'admin' ? 'Admin' : 'Student'}
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
                Start Time (06:00 - 18:00)
              </label>
              <input
                type="time"
                min="06:00"
                max="18:00"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                End Time (06:00 - 18:00)
              </label>
              <input
                type="time"
                min="06:00"
                max="18:00"
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Add / Edit Room Modal */}
      {isAdmin && (
        <Modal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
          title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Campus Room'}
        >
          <form onSubmit={handleSaveRoom} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  value={roomFormData.room_number}
                  onChange={(e) => setRoomFormData({ ...roomFormData, room_number: e.target.value })}
                  placeholder="e.g. 7A08"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Room Type
                </label>
                <select
                  value={roomFormData.type}
                  onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="classroom">Classroom</option>
                  <option value="lab">Lab</option>
                  <option value="seminar">Seminar Hall</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={roomFormData.capacity}
                  onChange={(e) => setRoomFormData({ ...roomFormData, capacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Floor
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={roomFormData.floor}
                  onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Base Status
                </label>
                <select
                  value={roomFormData.status}
                  onChange={(e) => setRoomFormData({ ...roomFormData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Equipment (comma-separated)
              </label>
              <input
                type="text"
                value={roomFormData.equipment}
                onChange={(e) => setRoomFormData({ ...roomFormData, equipment: e.target.value })}
                placeholder="projector, whiteboard, AC, sound_system"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#C4D9FF] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {editingRoom ? 'Update Room' : 'Create Room'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
