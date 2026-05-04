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
  Info,
  ChevronUp,
  ChevronDown,
  CalendarDays
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

const statusConfig: Record<string, { color: string; icon: any; label: string; gradient: string }> = {
  confirmada: { color: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600', icon: CheckCircle2, label: 'Confirmada' },
  pendente: { color: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600', icon: Clock, label: 'Pendente' },
  cancelada: { color: 'bg-rose-500', gradient: 'from-rose-400 to-rose-600', icon: XCircle, label: 'Cancelada' },
  concluida: { color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', icon: CheckCircle2, label: 'Concluída' },
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[1.5rem] p-1.5 border border-white/40 dark:border-white/10 shadow-xl shadow-black/5">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-white dark:hover:bg-white/10 h-11 w-11 transition-all">
              <ChevronLeft size={22} className="text-primary" />
            </Button>
            <div className="px-6 min-w-[200px] text-center">
              <h2 className="text-lg font-black uppercase tracking-widest text-foreground drop-shadow-sm">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-white dark:hover:bg-white/10 h-11 w-11 transition-all">
              <ChevronRight size={22} className="text-primary" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={goToToday} 
            className="rounded-[1.5rem] h-14 px-8 border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/5 hover:bg-primary hover:text-white transition-all group"
          >
            <CalendarDays size={16} className="mr-2 group-hover:rotate-12 transition-transform" />
            Hoje
          </Button>
        </div>

        <div className="relative flex-1 max-w-xl group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
          </div>
          <input 
            type="text"
            placeholder="Pesquisar por cliente, passeio ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 h-14 rounded-[1.5rem] border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-black/40 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold shadow-xl shadow-black/5 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden glass-card rounded-[2.5rem] border border-white/20">
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20 backdrop-blur-sm">
          {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
            <div key={day} className="py-5 text-center">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60">
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{day.substring(0, 3)}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-background/50">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayBookings = filteredBookingsByDay[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <motion.div 
                key={day.toString()} 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.005 }}
                className={cn(
                  "min-h-[160px] border-r border-b border-border/20 p-3 transition-all relative group/cell flex flex-col",
                  !isCurrentMonth && "bg-muted/10 opacity-40",
                  isTodayDay && "bg-primary/5 ring-1 ring-inset ring-primary/20"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={cn(
                    "text-sm font-black w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-500",
                    isTodayDay 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110 rotate-3" 
                      : "text-muted-foreground group-hover/cell:text-primary group-hover/cell:bg-primary/5",
                    !isCurrentMonth && "font-medium"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayBookings.length > 0 && (
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-black h-5 px-2 rounded-lg animate-pulse">
                        {dayBookings.length} {dayBookings.length === 1 ? 'RESERVA' : 'RESERVAS'}
                      </Badge>
                      <div className="flex -space-x-1.5 overflow-hidden p-0.5">
                        {dayBookings.slice(0, 3).map((b, i) => (
                          <div 
                            key={b.id} 
                            className={cn(
                              "w-2 h-2 rounded-full border border-background shadow-sm",
                              statusConfig[b.status]?.color || 'bg-gray-400'
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pb-2">
                  <AnimatePresence mode="popLayout">
                    {dayBookings.slice(0, 4).map((booking) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={booking.id}
                        onClick={() => onSelectBooking(booking)}
                        className={cn(
                          "group/item cursor-pointer p-2.5 rounded-xl border border-white/20 dark:border-white/5 hover:border-primary/30 hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 transition-all relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-sm",
                        )}
                      >
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b",
                          statusConfig[booking.status]?.gradient
                        )} />
                        <div className="pl-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[11px] font-black text-foreground truncate leading-none">
                              {booking.customerName}
                            </p>
                            <span className="text-[8px] font-bold opacity-40">#{booking.bookingCode.slice(-4)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="text-[9px] font-bold text-muted-foreground truncate opacity-80 uppercase tracking-tighter">
                              {booking.itemName.split('(')[0].trim()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {dayBookings.length > 4 && (
                    <button 
                      className="w-full py-1.5 rounded-lg border border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all group/more"
                    >
                      <span className="text-[9px] font-black text-primary/60 group-hover/more:text-primary uppercase tracking-[0.1em]">
                        + {dayBookings.length - 4} reservas
                      </span>
                    </button>
                  )}
                </div>
                
                <div className="absolute bottom-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                  <div className="bg-primary/10 p-1 rounded-md">
                    <Eye size={12} className="text-primary" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="glass-card p-4 rounded-2xl border border-white/20 flex items-center gap-4 group hover:scale-[1.02] transition-transform cursor-default">
            <div className={cn("w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-white bg-gradient-to-br", config.gradient)}>
              <config.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Status</p>
              <p className="text-xs font-black text-foreground">{config.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
