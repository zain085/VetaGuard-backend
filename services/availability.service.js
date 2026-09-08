const Appointment = require("../models/Appointment");

// Generate "HH:MM" slots between start and end at the given interval
function generateSlots(startTime, endTime, durationMinutes) {
  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTimeString = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  const slots = [];
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
    slots.push(toTimeString(t));
  }
  return slots;
}

/**
 * Returns the list of open time slots for a vet on a given calendar date,
 * based on their weekly availability minus already-booked appointments.
 * @param {import('mongoose').Types.ObjectId} vetUserId
 * @param {VetProfile} vetProfile
 * @param {Date} date - the calendar date being queried (time ignored)
 */
async function getAvailableSlots(vetUserId, vetProfile, date) {
  const dayOfWeek = date.getUTCDay();
  const daySchedules = vetProfile.availability.filter((slot) => slot.dayOfWeek === dayOfWeek);

  if (daySchedules.length === 0) return [];

  const allSlots = daySchedules.flatMap((schedule) =>
    generateSlots(schedule.startTime, schedule.endTime, schedule.slotDurationMinutes || 30)
  );

  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const booked = await Appointment.find({
    veterinarian: vetUserId,
    date: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["pending", "confirmed", "rescheduled"] },
  }).select("time");

  const bookedTimes = new Set(booked.map((a) => a.time));

  // Exclude past times if the date is today
  const now = new Date();
  const isToday = dayStart.toDateString() === new Date(now.toISOString()).toDateString();

  return allSlots.filter((slot) => {
    if (bookedTimes.has(slot)) return false;
    if (isToday) {
      const [h, m] = slot.split(":").map(Number);
      const slotMinutes = h * 60 + m;
      const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      if (slotMinutes <= nowMinutes) return false;
    }
    return true;
  });
}

module.exports = { getAvailableSlots, generateSlots };
