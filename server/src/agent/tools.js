// OpenAI-style tool definitions with two structural permission tiers:
// 1. Student Tools: Read-only lookups + Event Registration (No CRUD tools registered)
// 2. Admin Tools: Full CRUD across schedules/assignments/announcements/events + Room Bookings

export const studentTools = [
  {
    type: 'function',
    function: {
      name: 'get_current_context',
      description: 'Get the current date, day of week, time, and the logged-in student. Call this FIRST whenever the request involves "today", "tomorrow", "next", "this week", or "my".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_schedules',
      description: 'List class schedule entries for the student section, optionally filtered.',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'string', enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] },
          course: { type: 'string', description: 'Course code, e.g. "CSE 4113"' },
          section: { type: 'string' },
          after_time: { type: 'string', description: '24h "HH:MM"; only classes starting at or after this time' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_assignments',
      description: 'List assignments for the student section, optionally filtered by status, course, or deadline range.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'submitted', 'graded', 'late'] },
          course: { type: 'string' },
          deadline_from: { type: 'string', description: 'ISO date "YYYY-MM-DD" inclusive lower bound' },
          deadline_to: { type: 'string', description: 'ISO date "YYYY-MM-DD" inclusive upper bound' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_announcements',
      description: 'List announcements for the student section and campus-wide notices. Set active_only true to hide expired ones.',
      parameters: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          active_only: { type: 'boolean' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'List campus events, optionally filtered by date range or status.',
      parameters: {
        type: 'object',
        properties: {
          date_from: { type: 'string', description: 'ISO date "YYYY-MM-DD"' },
          date_to: { type: 'string', description: 'ISO date "YYYY-MM-DD"' },
          status: { type: 'string', enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'full'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_room',
      description: 'Get one room by its room_number, including its current bookings.',
      parameters: {
        type: 'object',
        properties: { room_number: { type: 'string', description: 'e.g. "7A02"' } },
        required: ['room_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_available_rooms',
      description: 'Find physical rooms free for a given date and time window, with optional capacity, equipment, and type filters.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'ISO date "YYYY-MM-DD"' },
          start_time: { type: 'string', description: '24h "HH:MM"' },
          end_time: { type: 'string', description: '24h "HH:MM"' },
          min_capacity: { type: 'number' },
          equipment: { type: 'array', items: { type: 'string' }, description: 'e.g. ["projector"]' },
          type: { type: 'string', enum: ['classroom', 'lab', 'seminar'] },
        },
        required: ['date', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'register_for_event',
      description: 'Register the logged-in student for an event by event_id. Fails if full, cancelled, or already registered.',
      parameters: {
        type: 'object',
        properties: { event_id: { type: 'string' } },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_registration',
      description: "Cancel the logged-in student's registration for an event by event_id.",
      parameters: {
        type: 'object',
        properties: { event_id: { type: 'string' } },
        required: ['event_id'],
      },
    },
  },
];

export const adminTools = [
  ...studentTools,
  {
    type: 'function',
    function: {
      name: 'book_room',
      description: 'Book a room for a time window. Fails if the room is busy or does not exist. Never guess parameters — ask if missing.',
      parameters: {
        type: 'object',
        properties: {
          room_number: { type: 'string' },
          date: { type: 'string', description: 'ISO date "YYYY-MM-DD"' },
          start_time: { type: 'string', description: '24h "HH:MM"' },
          end_time: { type: 'string', description: '24h "HH:MM"' },
          purpose: { type: 'string' },
        },
        required: ['room_number', 'date', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_booking',
      description: 'Cancel a room booking by its booking_id.',
      parameters: {
        type: 'object',
        properties: { booking_id: { type: 'string' } },
        required: ['booking_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_record',
      description: 'Admin tool: Create a new record in a system (schedules, assignments, announcements, events).',
      parameters: {
        type: 'object',
        properties: {
          system: { type: 'string', enum: ['schedules', 'assignments', 'announcements', 'events'] },
          data: { type: 'object', description: 'The record fields to create' },
        },
        required: ['system', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_record',
      description: 'Admin tool: Update an existing record in a system by ID.',
      parameters: {
        type: 'object',
        properties: {
          system: { type: 'string', enum: ['schedules', 'assignments', 'announcements', 'events', 'rooms'] },
          id: { type: 'string', description: 'The record _id' },
          data: { type: 'object', description: 'The partial updates to apply' },
        },
        required: ['system', 'id', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_record',
      description: 'Admin tool: Delete a record in a system by ID.',
      parameters: {
        type: 'object',
        properties: {
          system: { type: 'string', enum: ['schedules', 'assignments', 'announcements', 'events'] },
          id: { type: 'string', description: 'The record _id' },
        },
        required: ['system', 'id'],
      },
    },
  },
];

export const toolSchemas = adminTools;
