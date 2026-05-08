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
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-2xl md:rounded-[1.5rem] p-1 md:p-1.5 border border-white/40 dark:border-white/10 shadow-xl shadow-black/5">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-lg md:rounded-xl hover:bg-white dark:hover:bg-white/10 h-10 w-10 md:h-11 md:w-11 transition-all">
              <ChevronLeft size={20} className="text-primary" />
            </Button>
            <div className="px-4 md:px-6 min-w-[150px] md:min-w-[200px] text-center">
              <h2 className="text-sm md:text-lg font-black uppercase tracking-widest text-foreground drop-shadow-sm">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-lg md:rounded-xl hover:bg-white dark:hover:bg-white/10 h-10 w-10 md:h-11 md:w-11 transition-all">
              <ChevronRight size={20} className="text-primary" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={goToToday} 
            className="rounded-2xl md:rounded-[1.5rem] h-12 md:h-14 px-4 md:px-8 border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/5 hover:bg-primary hover:text-white transition-all group hidden sm:flex"
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
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 h-12 md:h-14 rounded-2xl md:rounded-[1.5rem] border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-black/40 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold shadow-xl shadow-black/5 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden glass-card rounded-2xl md:rounded-[2.5rem] border border-white/20">
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20 backdrop-blur-sm">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 md:py-5 text-center">
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.25em] text-primary/60">
                {day}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-background/50 divide-x divide-y divide-border/20">
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
                  "min-h-[120px] md:min-h-[220px] p-2 md:p-5 transition-all relative group/cell flex flex-col border-r border-b border-border/10",
                  !isCurrentMonth && "bg-muted/5 opacity-30 grayscale-[0.2]",
                  isTodayDay && "bg-primary/[0.08] ring-2 md:ring-4 ring-inset ring-primary/40 z-10",
                  dayBookings.length > 0 && isCurrentMonth && "bg-gradient-to-br from-white/10 to-primary/[0.05]"
                )}
              >
                <div className="flex items-start justify-between mb-2 md:mb-4">
                  <span className={cn(
                    "text-xs md:text-base font-black w-7 h-7 md:w-11 md:h-11 flex items-center justify-center rounded-lg md:rounded-2xl transition-all duration-500",
                    isTodayDay 
                      ? "bg-primary text-primary-foreground shadow-xl md:shadow-2xl shadow-primary/40 scale-105 md:scale-110 rotate-3 z-10" 
                      : "text-foreground/80 group-hover/cell:text-primary group-hover/cell:bg-primary/10",
                    !isCurrentMonth && "font-medium opacity-50"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayBookings.length > 0 && (
                    <div className="flex flex-col items-end gap-1 md:gap-1.5">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[7px] md:text-[9px] font-black h-4 md:h-5 px-1 md:px-2.5 rounded-full animate-pulse">
                        {dayBookings.length}
                      </Badge>
                      <div className="hidden md:flex -space-x-2 overflow-hidden p-0.5">
                        {dayBookings.slice(0, 4).map((b, i) => (
                          <div 
                            key={b.id} 
                            style={{ zIndex: 10 - i }}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full border-2 border-background shadow-sm",
                              statusConfig[b.status]?.color || 'bg-gray-400'
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 md:space-y-2.5 flex-1 overflow-y-auto no-scrollbar pb-1 md:pb-2">
                  <AnimatePresence mode="popLayout">
                    {dayBookings.slice(0, 6).map((booking) => (
                      <TooltipProvider key={booking.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              onClick={() => onSelectBooking(booking)}
                              className={cn(
                                "group/item cursor-pointer p-1.5 md:p-3.5 rounded-lg md:rounded-[1.25rem] border border-white/40 dark:border-white/10 hover:border-primary/50 hover:bg-white dark:hover:bg-white/20 hover:shadow-2xl transition-all relative overflow-hidden bg-white/80 dark:bg-black/40 backdrop-blur-md shadow-sm",
                              )}
                            >
                              <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 md:w-2.5 bg-gradient-to-b transition-all group-hover/item:w-1.5 md:group-hover/item:4",
                                statusConfig[booking.status]?.gradient
                              )} />
                              <div className="pl-2 md:pl-6">
                                <div className="flex items-center justify-between mb-0.5 md:mb-2">
                                  <p className="text-[8px] md:text-[14px] font-black text-foreground truncate leading-none tracking-tight group-hover/item:text-primary transition-colors">
                                    {booking.customerName.split(' ')[0]}
                                  </p>
                                  <span className="hidden md:inline text-[10px] font-black opacity-100 bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase">#{booking.bookingCode.slice(-4)}</span>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2.5">
                                  <div className={cn("w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full ring-2 md:ring-4 ring-white/30", statusConfig[booking.status]?.color)} />
                                  <p className="text-[7px] md:text-[11px] font-black text-muted-foreground truncate opacity-100 uppercase tracking-tight md:tracking-[0.15em] leading-none">
                                    {booking.itemName.split('(')[0].trim().substring(0, 10)}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl backdrop-blur-2xl w-72">
                            <div className={cn("h-2 w-full bg-gradient-to-r", statusConfig[booking.status]?.gradient)} />
                            <div className="p-6 bg-white/90 dark:bg-black/90 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Detalhes da Reserva</p>
                                  <h4 className="text-sm font-black text-foreground leading-tight">{booking.itemName}</h4>
                                </div>
                                <Badge className={cn("border-none text-[9px] font-black px-3 py-1 rounded-full text-white shadow-lg", statusConfig[booking.status]?.color)}>
                                  {statusConfig[booking.status]?.label.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Passageiros</p>
                                  <p className="text-xs font-black flex items-center gap-2"><Users size={12} className="text-primary" /> {booking.guests} pax</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Bruto</p>
                                  <p className="text-xs font-black text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(booking.finalTotal)}</p>
                                </div>
                              </div>

                              <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 flex items-center justify-between">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Código</span>
                                <span className="text-xs font-mono font-black text-primary">{booking.bookingCode}</span>
                              </div>
                              
                              <Button className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-10 shadow-lg shadow-primary/20">
                                <Eye size={14} className="mr-2" /> Ver Reserva Completa
                              </Button>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </AnimatePresence>
                  
                  {dayBookings.length > 6 && (
                    <button 
                      className="w-full py-1 md:py-2.5 mt-1 rounded-lg md:rounded-[1.25rem] border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all group/more active:scale-95 bg-white/40 dark:bg-black/20"
                    >
                      <span className="text-[7px] md:text-[10px] font-black text-primary group-hover/more:text-primary-foreground uppercase tracking-[0.1em] md:tracking-[0.25em] flex items-center justify-center gap-1 md:gap-2">
                        + {dayBookings.length - 6}
                        <ChevronDown size={10} className="md:w-3" />
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="glass-card p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/20 flex items-center gap-2 md:gap-4 group hover:scale-[1.02] transition-transform cursor-default">
            <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shadow-lg flex items-center justify-center text-white bg-gradient-to-br", config.gradient)}>
              <config.icon size={16} className="md:w-5" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5 opacity-60">Status</p>
              <p className="text-[10px] md:text-xs font-black text-foreground">{config.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};