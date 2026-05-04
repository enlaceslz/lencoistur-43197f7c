import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { BookingItem } from '@/hooks/useBookings';

interface BookingCalendarProps {
  bookings: BookingItem[];
  onSelectBooking: (booking: BookingItem) => void;
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  confirmada: { color: 'bg-emerald-500', icon: CheckCircle2, label: 'Confirmada' },
  pendente: { color: 'bg-amber-500', icon: Clock, label: 'Pendente' },
  cancelada: { color: 'bg-rose-500', icon: XCircle, label: 'Cancelada' },
  concluida: { color: 'bg-blue-500', icon: CheckCircle2, label: 'Concluída' },
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookings, onSelectBooking }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const bookingsByDay = useMemo(() => {
    const map: Record<string, BookingItem[]> = {};
    bookings.forEach(booking => {
      if (!booking.date) return;
      const dateKey = booking.date; // assumes YYYY-MM-DD
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(booking);
    });
    return map;
  }, [bookings]);

  const filteredBookingsByDay = useMemo(() => {
    if (!searchQuery) return bookingsByDay;
    
    const filteredMap: Record<string, BookingItem[]> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(bookingsByDay).forEach(([date, dayBookings]) => {
      const filtered = dayBookings.filter(b => 
        b.customerName.toLowerCase().includes(query) ||
        b.itemName.toLowerCase().includes(query) ||
        b.bookingCode.toLowerCase().includes(query)
      );
      if (filtered.length > 0) {
        filteredMap[date] = filtered;
      }
    });
    return filteredMap;
  }, [bookingsByDay, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted/50 rounded-2xl p-1 border border-border/50">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-background h-10 w-10">
              <ChevronLeft size={20} />
            </Button>
            <div className="px-4 min-w-[160px] text-center">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-background h-10 w-10">
              <ChevronRight size={20} />
            </Button>
          </div>
          <Button variant="outline" onClick={goToToday} className="rounded-2xl h-12 border-border/50 font-black text-[10px] uppercase tracking-widest">
            Hoje
          </Button>
        </div>

        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Filtrar no calendário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 h-12 rounded-2xl border border-border/50 bg-muted/30 focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden glass-card rounded-[2.5rem]">
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {day}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayBookings = filteredBookingsByDay[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "min-h-[140px] border-r border-b border-border/30 p-2 transition-colors relative group",
                  !isCurrentMonth && "bg-muted/5 opacity-40",
                  isTodayDay && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-black w-7 h-7 flex items-center justify-center rounded-full transition-all",
                    isTodayDay ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : "text-muted-foreground group-hover:text-foreground",
                    !isCurrentMonth && "font-medium"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayBookings.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-black h-5 px-1.5 rounded-md">
                      {dayBookings.length} {dayBookings.length === 1 ? 'RESERVA' : 'RESERVAS'}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[100px] overflow-y-auto no-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={booking.id}
                        onClick={() => onSelectBooking(booking)}
                        className={cn(
                          "group/item cursor-pointer p-1.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-background hover:shadow-sm transition-all relative overflow-hidden",
                          statusConfig[booking.status]?.color.replace('bg-', 'bg-').concat('/10')
                        )}
                      >
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1",
                          statusConfig[booking.status]?.color
                        )} />
                        <div className="pl-2">
                          <p className="text-[10px] font-bold text-foreground truncate leading-tight">
                            {booking.customerName}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate opacity-70">
                            {booking.itemName.split('(')[0]}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {dayBookings.length > 3 && (
                    <div className="text-center py-1">
                      <span className="text-[9px] font-black text-primary/60 hover:text-primary transition-colors cursor-pointer uppercase tracking-tighter">
                        + {dayBookings.length - 3} mais
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-6 py-4 px-8 glass-card rounded-[2rem] border border-border/30">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full shadow-sm", config.color)} />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {config.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
