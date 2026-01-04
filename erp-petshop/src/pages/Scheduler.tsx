import React, { useState, useEffect } from 'react';
import { Scissors, Settings } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import type { Appointment } from '../services/appointmentService';
import { format, addMinutes, startOfToday, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewAppointmentModal } from '../components/NewAppointmentModal';


interface Professional {
    id: string;
    name: string;
}

// ---------------------------------------------------------------------------
// Appointment Card Component (Static - No Drag)
// ---------------------------------------------------------------------------
const AppointmentCard = ({ appointment, top, height, onClick }: { appointment: Appointment, top: number, height: number, onClick: (appt: Appointment) => void }) => {
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick(appointment);
            }}
            className="absolute left-1 right-1 bg-blue-100 border-l-4 border-blue-500 rounded p-1 text-xs overflow-hidden cursor-pointer hover:shadow-md transition-shadow select-none group"
            style={{
                position: 'absolute',
                top: `${top}px`,
                height: `${height}px`,
                zIndex: 10
            }}
            title="Clique para editar"
        >
            <div className="font-bold text-blue-800">{appointment.pets?.name || 'Pet'}</div>
            <div className="text-blue-600">{appointment.services?.map((s: any) => s.services?.name || s.name || 'Serviço').join(', ')}</div>
            <div className="text-[10px] text-gray-500 mt-1 hidden group-hover:block">
                {format(parseISO(appointment.start_time), 'HH:mm')} - {format(parseISO(appointment.end_time), 'HH:mm')}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Droppable Slot Component (Static - Click to Create only)
// ---------------------------------------------------------------------------
const TimeSlot = ({ children, onClick, disabled }: { children?: React.ReactNode, onClick?: () => void, disabled?: boolean }) => {
    return (
        <div
            onClick={!disabled ? onClick : undefined}
            className={`h-12 border-b border-gray-100 relative group transition-colors 
                ${disabled
                    ? 'bg-gray-50 cursor-not-allowed'
                    : 'hover:bg-blue-50 cursor-pointer'
                }`}
        >
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Month View Component
// ---------------------------------------------------------------------------
const MonthView = ({
    selectedDate,
    appointments,
    onDayClick
}: {
    selectedDate: Date,
    appointments: Appointment[],
    onDayClick: (date: Date) => void
}) => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, "d");
            const cloneDay = day;

            // Find appointments for this day
            const dayApps = appointments.filter(app =>
                isSameDay(parseISO(app.start_time), day)
            );

            days.push(
                <div
                    key={day.toISOString()}
                    className={`col h-32 border border-gray-100 p-2 relative bg-white hover:bg-gray-50 cursor-pointer transition-colors
                        ${!isSameMonth(day, monthStart) ? "text-gray-300 bg-gray-50" : "text-gray-700"}
                        ${isSameDay(day, new Date()) ? "bg-blue-50" : ""}
                    `}
                    onClick={() => onDayClick(cloneDay)}
                >
                    <span className={`text-sm font-bold block mb-1 ${isSameDay(day, new Date()) ? "text-blue-600" : ""}`}>
                        {formattedDate}
                    </span>

                    {/* Appointment Dots/List */}
                    <div className="space-y-1 overflow-hidden h-24">
                        {dayApps.map(app => (
                            <div key={app.id} className="text-xs truncate bg-blue-100 text-blue-800 rounded px-1 py-0.5">
                                {format(parseISO(app.start_time), 'HH:mm')} {app.pets?.name}
                            </div>
                        ))}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7" key={day.toISOString()}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="flex-1 overflow-auto bg-white">
            <div className="grid grid-cols-7 border-b bg-gray-100 py-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-center text-sm font-semibold text-gray-500">
                        {d}
                    </div>
                ))}
            </div>
            {rows}
        </div>
    );
};

export default function Scheduler() {
    const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const handleEditAppointment = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setIsModalOpen(true);
    };

    // Constants
    const START_HOUR = 6;
    const END_HOUR = 20;
    const SLOT_MINUTES = 15;

    // Time Slots
    const timeSlots: Date[] = [];
    if (viewMode === 'day') {
        let currentTime = new Date(selectedDate);
        currentTime.setHours(START_HOUR, 0, 0, 0);
        const endTime = new Date(selectedDate);
        endTime.setHours(END_HOUR, 0, 0, 0);
        while (currentTime < endTime) {
            timeSlots.push(new Date(currentTime));
            currentTime = addMinutes(currentTime, SLOT_MINUTES);
        }
    }

    useEffect(() => {
        loadData();
    }, [selectedDate, viewMode]);

    const loadData = async () => {
        try {
            const options = await appointmentService.getGroomingOptions();
            setProfessionals(options.professionals);

            let apps = [];
            if (viewMode === 'month') {
                const start = startOfWeek(startOfMonth(selectedDate)).toISOString();
                const end = endOfWeek(endOfMonth(selectedDate)).toISOString();
                apps = await appointmentService.list({ startDate: start, endDate: end });
            } else {
                apps = await appointmentService.list({ date: selectedDate.toISOString() });
            }
            // Ensure appointments are parsed correctly if needed (dates are strings from JSON)
            setAppointments(apps);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
        }
    };



    const [modalDefaults, setModalDefaults] = useState<{ startHour?: string, professionalId?: string } | undefined>(undefined);

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Modal */}
            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAppointment(null);
                    setModalDefaults(undefined);
                }}
                onSuccess={loadData}
                selectedDate={selectedDate}
                initialData={editingAppointment}
                existingAppointments={appointments}
                defaultValues={modalDefaults}
            />

            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Agendamento</h1>

                    {/* View Switcher */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'day' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Mês
                        </button>
                    </div>

                    {/* Date Nav */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => {
                                if (viewMode === 'day') setSelectedDate(prev => addMinutes(prev, -1440));
                                else setSelectedDate(prev => addDays(startOfMonth(prev), -1));
                            }}
                            className="p-2 hover:bg-white rounded-md transition-colors"
                        >
                            &lt;
                        </button>
                        <span className="px-4 font-medium capitalize min-w-[200px] text-center">
                            {format(selectedDate, viewMode === 'day' ? 'EEEE, dd MMMM' : 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button
                            onClick={() => {
                                if (viewMode === 'day') setSelectedDate(prev => addMinutes(prev, 1440));
                                else setSelectedDate(prev => addDays(endOfMonth(prev), 1));
                            }}
                            className="p-2 hover:bg-white rounded-md transition-colors"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={selectedDate < startOfToday()}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm
                        ${selectedDate < startOfToday()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                        }
                    `}
                    title={selectedDate < startOfToday() ? "Não é possível agendar em datas passadas" : "Novo Agendamento"}
                >
                    <Scissors size={18} />
                    Novo Agendamento
                </button>
                <a href="/admin/grooming-settings" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Configurações">
                    <Settings size={20} />
                </a>
            </header>

            {/* Render Logic */}
            {viewMode === 'month' ? (
                <MonthView
                    selectedDate={selectedDate}
                    appointments={appointments}
                    onDayClick={(date) => {
                        setSelectedDate(date);
                        setViewMode('day');
                    }}
                />
            ) : (
                /* Grid Area (Day View) */
                <div className="flex-1 overflow-auto flex">
                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 bg-white border-r sticky left-0 z-20 flex flex-col">
                        <div className="h-10 border-b bg-gray-50 sticky top-0 z-20 flex-shrink-0"></div>
                        <div className="relative">
                            {timeSlots.map((slot, i) => (
                                <div key={i} className="h-12 border-b flex items-center justify-center text-xs text-gray-500">
                                    {format(slot, 'HH:mm')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Professional Columns */}
                    {professionals.map(prof => (
                        <div key={prof.id} className="min-w-[200px] flex-1 border-r flex flex-col">
                            <div className="h-10 border-b bg-gray-50 flex items-center justify-center font-medium sticky top-0 z-10 flex-shrink-0">
                                {prof.name}
                            </div>
                            <div className="relative">
                                {timeSlots.map((slot, i) => {
                                    const isRetroactive = slot < new Date();
                                    return (
                                        <TimeSlot
                                            key={i}
                                            disabled={isRetroactive}
                                            onClick={() => {
                                                setModalDefaults({
                                                    startHour: format(slot, 'HH:mm'),
                                                    professionalId: prof.id
                                                });
                                                setIsModalOpen(true);
                                            }}
                                        />
                                    );
                                })}
                                {appointments
                                    .filter(app => app.services.some((s: any) => s.professional_id === prof.id || s.professional?.id === prof.id))
                                    .map(app => {
                                        const start = new Date(app.start_time);
                                        const end = new Date(app.end_time);

                                        // Usar hora local para posicionamento
                                        const startMinutes = (start.getHours() * 60) + start.getMinutes();
                                        const dayStartMinutes = (START_HOUR * 60);
                                        const offsetMinutes = startMinutes - dayStartMinutes;
                                        const PIXELS_PER_MIN = 48 / 15; // h-12 = 48px / 15min slot
                                        const top = offsetMinutes * PIXELS_PER_MIN;
                                        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                                        const height = durationMinutes * PIXELS_PER_MIN;

                                        return (
                                            <AppointmentCard
                                                key={app.id}
                                                appointment={app}
                                                top={top}
                                                height={height}
                                                onClick={handleEditAppointment}
                                            />
                                        )
                                    })
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
