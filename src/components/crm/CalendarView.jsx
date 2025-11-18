import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NeuroButton from "./NeuroButton";

export default function CalendarView({ view, currentDate, onDateChange, activities, onEventClick, onTimeSlotClick }) {
  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Previous month days
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const getWeekDays = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date);
    sunday.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toDateString();
    return activities.filter(a => new Date(a.activity_date).toDateString() === dateStr);
  };

  const getEventsForHour = (date, hour) => {
    return activities.filter(a => {
      const eventDate = new Date(a.activity_date);
      return eventDate.toDateString() === date.toDateString() && eventDate.getHours() === hour;
    });
  };

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (view === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else if (view === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (view === 'year') newDate.setFullYear(newDate.getFullYear() + direction);
    onDateChange(newDate);
  };

  // Month View
  if (view === 'month') {
    const days = getMonthDays(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <NeuroButton onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </NeuroButton>
          <h3 className="font-bold text-lg" style={{ color: "#666" }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <NeuroButton onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </NeuroButton>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-medium text-sm py-2" style={{ color: "#888" }}>
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            const events = getEventsForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            return (
              <div
                key={idx}
                onClick={() => onTimeSlotClick && onTimeSlotClick(day.date)}
                className={`ampvibe-inset p-2 min-h-24 cursor-pointer hover:opacity-80 transition-opacity ${
                  !day.isCurrentMonth ? 'opacity-50' : ''
                } ${isToday ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="font-medium text-sm mb-1" style={{ color: day.isCurrentMonth ? "#666" : "#aaa" }}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className="text-xs p-1 rounded truncate cursor-pointer"
                      style={{ 
                        background: event.google_event_id ? '#e6f7ff' : '#f0f0f0',
                        color: event.google_event_id ? '#0066cc' : '#666'
                      }}
                    >
                      {event.subject}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs" style={{ color: "#aaa" }}>
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Week View
  if (view === 'week') {
    const weekDays = getWeekDays(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <NeuroButton onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </NeuroButton>
          <h3 className="font-bold text-lg" style={{ color: "#666" }}>
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          <NeuroButton onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </NeuroButton>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 min-w-[800px]">
            <div className="text-sm font-medium" style={{ color: "#888" }}>Time</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="text-center text-sm font-medium" style={{ color: "#888" }}>
                <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={day.toDateString() === new Date().toDateString() ? 'text-green-600 font-bold' : ''}>
                  {day.getDate()}
                </div>
              </div>
            ))}
            
            {hours.map(hour => (
              <React.Fragment key={hour}>
                <div className="text-xs py-2" style={{ color: "#aaa" }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map(day => {
                  const events = getEventsForHour(day, hour);
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      onClick={() => {
                        const slotDate = new Date(day);
                        slotDate.setHours(hour, 0, 0, 0);
                        onTimeSlotClick && onTimeSlotClick(slotDate);
                      }}
                      className="ampvibe-inset p-1 min-h-12 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {events.map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                          className="text-xs p-1 rounded mb-1 truncate cursor-pointer"
                          style={{ 
                            background: event.google_event_id ? '#e6f7ff' : '#f0f0f0',
                            color: event.google_event_id ? '#0066cc' : '#666'
                          }}
                        >
                          {event.subject}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Day View
  if (view === 'day') {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <NeuroButton onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </NeuroButton>
          <h3 className="font-bold text-lg" style={{ color: "#666" }}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <NeuroButton onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </NeuroButton>
        </div>

        <div className="space-y-2">
          {hours.map(hour => {
            const events = getEventsForHour(currentDate, hour);
            return (
              <div key={hour} className="flex gap-2">
                <div className="w-20 text-sm py-2" style={{ color: "#888" }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  onClick={() => {
                    const slotDate = new Date(currentDate);
                    slotDate.setHours(hour, 0, 0, 0);
                    onTimeSlotClick && onTimeSlotClick(slotDate);
                  }}
                  className="flex-1 ampvibe-inset p-2 min-h-16 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {events.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className="p-2 rounded mb-1 cursor-pointer"
                      style={{ 
                        background: event.google_event_id ? '#e6f7ff' : '#f0f0f0',
                        color: event.google_event_id ? '#0066cc' : '#666'
                      }}
                    >
                      <div className="font-medium">{event.subject}</div>
                      {event.description && (
                        <div className="text-xs mt-1">{event.description.substring(0, 100)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Year View
  if (view === 'year') {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), i, 1);
      return { date, name: date.toLocaleDateString('en-US', { month: 'short' }) };
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <NeuroButton onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </NeuroButton>
          <h3 className="font-bold text-2xl" style={{ color: "#666" }}>
            {currentDate.getFullYear()}
          </h3>
          <NeuroButton onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </NeuroButton>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {months.map(({ date, name }) => {
            const monthEvents = activities.filter(a => {
              const eventDate = new Date(a.activity_date);
              return eventDate.getFullYear() === date.getFullYear() && eventDate.getMonth() === date.getMonth();
            });

            return (
              <div
                key={name}
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(date.getMonth());
                  onDateChange(newDate);
                }}
                className="ampvibe-inset p-4 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="font-bold mb-2" style={{ color: "#666" }}>{name}</div>
                <div className="text-sm" style={{ color: "#888" }}>
                  {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}