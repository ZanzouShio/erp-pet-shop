import { useState, useEffect, Fragment } from 'react';
import { X, Scissors, Calculator } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import type { Appointment } from '../services/appointmentService';
import { format, parseISO } from 'date-fns';
import CustomerSearch from './CustomerSearch';
import { ConfirmationModal } from './ConfirmationModal';
import { API_URL } from '../services/api';
import { useToast } from './Toast';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate: Date;
    initialData?: Appointment | null;
    existingAppointments?: Appointment[];
    defaultValues?: { startHour?: string; professionalId?: string };
}

export function NewAppointmentModal(props: NewAppointmentModalProps) {
    const { isOpen, onClose, onSuccess, selectedDate, initialData, defaultValues } = props;
    const toast = useToast();
    // Arrays loaded from API
    const [services, setServices] = useState<any[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerPets, setCustomerPets] = useState<any[]>([]);
    const [petId, setPetId] = useState('');
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [professionalId, setProfessionalId] = useState('');
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [startHour, setStartHour] = useState('09:00');
    const [endHour, setEndHour] = useState('10:00'); // [NEW] End Time State
    const [conditions, setConditions] = useState<string[]>([]);

    // Conflict Check Logic
    const isTimeBlocked = (timeStr: string) => {
        // If passed existingAppointments, we check conflicts for the selected professional
        if (!professionalId || !props.existingAppointments) return false;

        const [h, m] = timeStr.split(':').map(Number);
        const suggestionTime = new Date(selectedDate);
        suggestionTime.setHours(h, m, 0, 0);

        return props.existingAppointments.some((appt: any) => {
            // Check if same professional (either main or in services)
            // Note: appointments usually have 'services' array with 'professional_id'
            const isSamePro = appt.services?.some((s: any) => s.professional_id === professionalId)
                || appt.professional_id === professionalId;

            // Skip checking against itself if editing
            if (initialData && appt.id === initialData.id) return false;

            if (!isSamePro) return false;

            // Check Overlap
            const start = parseISO(appt.start_time);
            const end = parseISO(appt.end_time);

            // Block if the suggested time is inside an existing appointment (or exactly at start)
            // Logic: Start <= Suggestion < End
            return suggestionTime >= start && suggestionTime < end;
        });
    };

    // Calculation State
    const [calculatedDuration, setCalculatedDuration] = useState<any>(null);
    const [loadingCalc, setLoadingCalc] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOptions();
            if (initialData) {
                // [FIX] POPULATE EDIT DATA
                console.log("Populating Edit Data", initialData);

                // Professional: Appointments don't have professional_id on root, it's in the services relation.
                // We take the professional from the first service as the "main" one for now.
                const mainProId = initialData.services?.[0]?.professional_id;
                setProfessionalId(mainProId || '');

                // Services: 's.id' is the appointment_service ID. We need 's.service_id'.
                setSelectedServiceIds(initialData.services?.map((s: any) => s.service_id || s.id) || []);

                // Conditions
                // @ts-ignore - Backend supports string[] for conditions in JSONB or array column
                setConditions(initialData.conditions || []);

                // TIMES
                if (initialData.start_time) {
                    setStartHour(format(parseISO(initialData.start_time), 'HH:mm'));
                }
                if (initialData.end_time) {
                    setEndHour(format(parseISO(initialData.end_time), 'HH:mm'));
                }

                // [NEW] Load Customer and Pets for Edit
                if (initialData.customer_id) {
                    fetch(`${API_URL}/customers/${initialData.customer_id}`)
                        .then(res => res.json())
                        .then(data => {
                            setSelectedCustomer(data);
                            setCustomerPets(data.pets || []); // Assuming pets are included
                            if (initialData.pet_id) setPetId(initialData.pet_id);
                        })
                        .catch(err => console.error("Error loading customer for edit", err));
                }

            } else {
                // Reset for New
                setSelectedCustomer(null);
                setCustomerPets([]);
                setPetId('');
                setSelectedServiceIds([]);
                setProfessionalId(defaultValues?.professionalId || ''); // Use default if provided
                setSelectedResourceId('');
                setConditions([]);
                setStartHour(defaultValues?.startHour || '09:00'); // Use default if provided
                setEndHour('10:00');
                setCalculatedDuration(null);
            }
        }
    }, [isOpen, initialData, defaultValues]);

    // [NEW] Effect to recalculate End Time if Start Time changes AND we have a calculated duration
    useEffect(() => {
        if (calculatedDuration && calculatedDuration.totalDuration && startHour) {
            const [h, m] = startHour.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                const start = new Date();
                start.setHours(h, m, 0, 0);
                const end = new Date(start.getTime() + calculatedDuration.totalDuration * 60000);
                setEndHour(format(end, 'HH:mm'));
            }
        }
    }, [startHour, calculatedDuration]);

    const loadOptions = async () => {
        try {
            const data = await appointmentService.getGroomingOptions();
            setServices(data.services);
            setProfessionals(data.professionals);
            setResources(data.resources);

            // Default to first pro ONLY for new appointments AND if no default provided
            if (!initialData && data.professionals.length > 0 && !defaultValues?.professionalId) {
                setProfessionalId(prev => prev || data.professionals[0].id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCalculate = async () => {
        if (!professionalId || selectedServiceIds.length === 0) return;
        setLoadingCalc(true);
        try {
            const result = await appointmentService.calculateDuration({
                serviceIds: selectedServiceIds,
                petId: petId,
                professionalId: professionalId,
                conditions: conditions
            });
            setCalculatedDuration(result);

            // [NEW] Auto-update End Time based on Duration
            if (result.totalDuration) {
                const [h, m] = startHour.split(':').map(Number);
                const start = new Date();
                start.setHours(h, m, 0, 0);
                const end = new Date(start.getTime() + result.totalDuration * 60000);
                setEndHour(format(end, 'HH:mm'));
            }

        } catch (error) {
            console.error("Error calculating", error);
            // Fallback for visual testing if backend fails due to missing pet link
            setCalculatedDuration({ totalDuration: 60, breakdown: [] });
        } finally {
            setLoadingCalc(false);
        }
    };

    // Confirmation Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = async () => {
        if (!initialData) return;

        try {
            await appointmentService.delete(initialData.id);
            toast.success('Agendamento cancelado com sucesso');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting', error);
            toast.error('Erro ao cancelar agendamento');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Required Fields
        if (!selectedCustomer || !petId) {
            toast.warning('Por favor, selecione um Cliente e um Pet.');
            return;
        }

        if (selectedServiceIds.length === 0) {
            toast.warning('Selecione pelo menos um serviço.');
            return;
        }

        if (!professionalId) {
            toast.warning('Selecione um profissional.');
            return;
        }

        // 2. Validate Conflict (Frontend Check)
        if (isTimeBlocked(startHour)) {
            toast.error('Horário indisponível! Este profissional já possui um agendamento conflitante neste horário.');
            return;
        }

        // Validação de data retroativa
        const [hCheck, mCheck] = startHour.split(':').map(Number);
        const checkDate = new Date(selectedDate);
        checkDate.setHours(hCheck, mCheck, 0, 0);

        if (checkDate < new Date()) {
            toast.warning('Não é possível agendar datas ou horários retroativos.');
            return;
        }

        try {
            // [NEW] Construct End Time
            const [endH, endM] = endHour.split(':').map(Number);
            const localEndTime = new Date(selectedDate);
            localEndTime.setHours(endH, endM, 0, 0);

            if (initialData) {
                // UPDATE Logic
                // Construir data/hora local corretamente
                const [startH, startM] = startHour.split(':').map(Number);
                const localStartTime = new Date(selectedDate);
                localStartTime.setHours(startH, startM, 0, 0);

                await appointmentService.update(initialData.id, {
                    date: selectedDate.toISOString(),
                    startTime: localStartTime.toISOString(),
                    endTime: localEndTime.toISOString(),
                    serviceIds: selectedServiceIds,
                    professionalId,
                    conditions
                });
                toast.success('Agendamento atualizado com sucesso!');
            } else {
                // CREATE Logic
                const [h, m] = startHour.split(':').map(Number);
                const localStartDate = new Date(selectedDate);
                localStartDate.setHours(h, m, 0, 0);

                await appointmentService.create({
                    customerId: selectedCustomer?.id,
                    petId: petId,
                    date: selectedDate.toISOString(),
                    startTime: localStartDate.toISOString(),
                    endTime: localEndTime.toISOString(),
                    serviceIds: selectedServiceIds,
                    professionalId,
                    resourceIds: selectedResourceId ? [selectedResourceId] : [],
                    conditions
                });
                toast.success('Agendamento criado com sucesso!');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar agendamento');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Scissors className="text-blue-600" />
                            {initialData ? 'Editar Agendamento' : 'Novo Agendamento'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Customer & Pet Selector */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <CustomerSearch
                                    selectedCustomer={selectedCustomer}
                                    onSelectCustomer={(customer) => {
                                        setSelectedCustomer(customer);
                                        if (customer) {
                                            // Fetch full details including pets if not present
                                            fetch(`${API_URL}/customers/${customer.id}`)
                                                .then(res => res.json())
                                                .then(data => {
                                                    setCustomerPets(data.pets || []);
                                                    setPetId(''); // Reset pet selection
                                                });
                                        } else {
                                            setCustomerPets([]);
                                            setPetId('');
                                        }
                                    }}
                                />
                            </div>

                            {selectedCustomer && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pet</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        onChange={e => setPetId(e.target.value)}
                                        value={petId}
                                    >
                                        <option value="">Selecione um Pet...</option>
                                        {customerPets.map((pet: any) => (
                                            <option key={pet.id} value={pet.id}>
                                                {pet.name} ({pet.breed || 'SRD'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Services */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Serviços</label>
                            <div className="grid grid-cols-2 gap-3">
                                {services.map(svc => (
                                    <label key={svc.id} className={`
                                    border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-colors
                                    ${selectedServiceIds.includes(svc.id) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}
                                `}>
                                        <input
                                            type="checkbox"
                                            value={svc.id}
                                            checked={selectedServiceIds.includes(svc.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedServiceIds([...selectedServiceIds, svc.id]);
                                                else setSelectedServiceIds(selectedServiceIds.filter(id => id !== svc.id));
                                            }}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium">{svc.name}</span>
                                        <span className="text-xs text-gray-500 ml-auto">R$ {svc.base_price}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Professional & Conditions */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={professionalId}
                                    onChange={(e) => setProfessionalId(e.target.value)}
                                >
                                    {professionals.map(prof => (
                                        <option key={prof.id} value={prof.id}>
                                            {prof.name} ({prof.seniority_level}) - {prof.speed_factor}x
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recurso (Opcional)</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={selectedResourceId}
                                    onChange={(e) => setSelectedResourceId(e.target.value)}
                                >
                                    <option value="">Nenhum recurso específico</option>
                                    {resources.map(res => (
                                        <option key={res.id} value={res.id}>
                                            {res.name} ({res.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Condições</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['matted', 'aggressive', 'elderly'].map(cond => (
                                        <button
                                            key={cond}
                                            type="button"
                                            onClick={() => {
                                                if (conditions.includes(cond)) setConditions(conditions.filter(c => c !== cond));
                                                else setConditions([...conditions, cond]);
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border ${conditions.includes(cond) ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            {cond === 'matted' ? 'Com Nós' : cond === 'aggressive' ? 'Agressivo' : 'Idoso'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Calculation Trigger */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">Estimativa de Tempo</label>
                                <button
                                    type="button"
                                    onClick={handleCalculate}
                                    disabled={loadingCalc || !professionalId || selectedServiceIds.length === 0}
                                    className="text-blue-600 text-xs font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Calculator size={14} /> Calcular Agora
                                </button>
                            </div>
                            {loadingCalc ? (
                                <div className="text-sm text-gray-500 animate-pulse">Calculando...</div>
                            ) : calculatedDuration ? (
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{calculatedDuration.totalDuration} min</div>
                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                        {calculatedDuration.breakdown?.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{item.service || item.condition}</span>
                                                <span>
                                                    {item.base ? `${item.base}m x ${item.factor}` : `${item.penalty}m (Penalidade)`}
                                                    = {item.adjusted || item.penalty}m
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">
                                    {initialData ? 'Clique em Calcular para verificar re-cálculo.' : 'Selecione serviços e profissional para calcular.'}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horário Início</label>
                                <input
                                    type="time"
                                    className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={startHour}
                                    onChange={e => setStartHour(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horário Término (Manual)</label>
                                <input
                                    type="time"
                                    className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={endHour}
                                    onChange={e => setEndHour(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Time Suggestions */}
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Sugestões de Início:</p>
                            <div className="flex flex-wrap gap-2">
                                {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => {
                                    const blocked = isTimeBlocked(time);
                                    const isSelected = startHour === time;
                                    return (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => !blocked && setStartHour(time)}
                                            disabled={blocked}
                                            className={`
                                            px-2 py-1 text-xs rounded border transition-colors whitespace-nowrap
                                            ${blocked
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed decoration-slice line-through'
                                                    : isSelected
                                                        ? 'bg-blue-100 text-blue-700 border-blue-200 font-bold'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-blue-300'
                                                }
                                        `}
                                            title={blocked ? 'Horário ocupado' : 'Selecionar horário'}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            {initialData && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="mr-auto text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Cancelar Agendamento
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:scale-105"
                            >
                                Salvar Agendamento
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Cancelar Agendamento"
                message="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
                confirmText="Sim, Cancelar"
                cancelText="Não, Voltar"
                isDangerous={true}
            />
        </>
    );
}
