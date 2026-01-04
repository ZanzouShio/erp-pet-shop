import { prisma } from '../db.js';
import { addMinutes, areIntervalsOverlapping, parseISO } from 'date-fns';

export const calculateDuration = async (req, res) => {
    try {
        const { serviceIds, petId, professionalId, conditions } = req.body;

        if (!petId || !professionalId) {
            return res.status(400).json({ error: 'Pet and Professional are required for calculation.' });
        }

        // 1. Fetch Data
        const pet = await prisma.pets.findUnique({
            where: { id: petId },
            include: { pet_breeds: true } // Need size/coat_type
        });

        if (!pet) return res.status(404).json({ error: 'Pet not found' });

        const professional = await prisma.users.findUnique({
            where: { id: professionalId }
        });

        if (!professional) return res.status(404).json({ error: 'Professional not found' });

        const services = await prisma.services.findMany({
            where: { id: { in: serviceIds } },
            include: {
                service_matrix: true
            }
        });

        // 2. Determine Characteristics
        // Use Pet's explicit size/coat, fallback to Breed, fallback to 'M'/'curto'
        const size = pet.size || pet.pet_breeds?.size || 'M';
        const coat = pet.coat_type || pet.pet_breeds?.coat_type || 'curto';

        let totalMinutes = 0;
        const breakdown = [];

        // 3. Calculate Base Time per Service
        for (const service of services) {
            const matrixEntry = service.service_matrix.find(m =>
                m.breed_size === size && m.coat_type === coat
            );

            const baseDuration = matrixEntry ? matrixEntry.base_duration : 30; // Default 30 min
            const speedFactor = parseFloat(professional.speed_factor || 1.0);

            // Logic: Base * SpeedFactor
            // Example: 30min * 1.2 (Junior) = 36min
            const adjustedDuration = Math.ceil(baseDuration * speedFactor);

            totalMinutes += adjustedDuration;
            breakdown.push({
                service: service.name,
                base: baseDuration,
                adjusted: adjustedDuration,
                factor: speedFactor
            });
        }

        // 4. Conditions Penalty
        if (conditions && Array.isArray(conditions)) {
            if (conditions.includes('matted')) {
                totalMinutes += 30;
                breakdown.push({ condition: 'matted', penalty: 30 });
            }
            if (conditions.includes('aggressive')) {
                totalMinutes += 20;
                breakdown.push({ condition: 'aggressive', penalty: 20 });
            }
            if (conditions.includes('elderly')) {
                totalMinutes += 15;
                breakdown.push({ condition: 'elderly', penalty: 15 });
            }
        }

        res.json({ totalDuration: totalMinutes, breakdown });

    } catch (error) {
        console.error('Error calculating duration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createAppointment = async (req, res) => {
    try {
        const {
            customerId,
            petId,
            date,
            startTime,
            serviceIds,
            professionalId,
            resourceIds,
            conditions
        } = req.body;

        // 1. Calculate Duration (Internal Logic reuse or allow override?)
        // For safety, we recalculate or trust the frontend's passed end_time if validated.
        // Let's rely on the passed startTime and calculate end_time based on duration logic to be safe.

        // ... (Call calculate logic internaly - simplified for MVP: User passes end_time or duration)
        // MVP: Admin sends start_time and end_time (calculated by frontend)
        const start = parseISO(startTime);

        // Validação de data retroativa
        if (start < new Date()) {
            return res.status(400).json({ error: 'Não é possível agendar em datas retroativas.' });
        }

        const end = req.body.endTime ? parseISO(req.body.endTime) : addMinutes(start, 30); // Fallback

        // 2. Conflict Validation (Professional)
        const existingProfApps = await prisma.appointment_services.findMany({
            where: {
                professional_id: professionalId,
                appointments: {
                    status: { notIn: ['cancelled'] }, // Ignore cancelled
                    // Check overlap
                    OR: [
                        { start_time: { lt: end }, end_time: { gt: start } }
                    ]
                }
            }
        });

        if (existingProfApps.length > 0) {
            console.log('Conflict detected for professional:', professionalId);
            console.log('Request interval:', start, end);
            console.log('Conflicting appointments:', JSON.stringify(existingProfApps, null, 2));
            return res.status(409).json({ error: 'Professional is busy at this time.' });
        }

        // 3. Conflict Validation (Resources)
        if (resourceIds && resourceIds.length > 0) {
            const existingResApps = await prisma.appointment_resources.findMany({
                where: {
                    resource_id: { in: resourceIds },
                    // Overlap check (assuming appointment_resources follows main appt time or has its own)
                    // Simplified: Check main appointment table via relation
                    appointments: {
                        status: { notIn: ['cancelled'] },
                        OR: [
                            { start_time: { lt: end }, end_time: { gt: start } }
                        ]
                    }
                },
                include: { appointments: true }
            });

            if (existingResApps.length > 0) {
                console.log('Conflict detected for resources:', resourceIds);
                console.log('Conflicting resource appointments:', JSON.stringify(existingResApps, null, 2));
                return res.status(409).json({ error: 'One or more resources are unavailable.' });
            }
        }

        // 4. Create Appointment
        const appointment = await prisma.appointments.create({
            data: {
                customer_id: customerId,
                pet_id: petId,
                date: parseISO(date),
                start_time: start,
                end_time: end,
                status: 'scheduled',
                notes: req.body.notes,
                conditions: conditions || []
            }
        });

        // 5. Connect Services & Resources
        // ... (simplified connection logic - usually createMany)
        // For MVP, we assume services are linked via appointment_services
        if (serviceIds && serviceIds.length > 0) {
            // Buscar dados para cálculo de comissão
            const professional = await prisma.users.findUnique({
                where: { id: professionalId },
                select: { commission_rate: true }
            });
            const commissionRate = Number(professional?.commission_rate || 0);

            const servicesData = await prisma.services.findMany({
                where: { id: { in: serviceIds } },
                select: { id: true, base_price: true }
            });
            const serviceMap = new Map(servicesData.map(s => [s.id, Number(s.base_price)]));

            const servicesPayload = serviceIds.map(sid => {
                const price = serviceMap.get(sid) || 0;
                const commission = price * (commissionRate / 100);
                return {
                    appointment_id: appointment.id,
                    service_id: sid,
                    professional_id: professionalId,
                    price: price,
                    commission_rate_snapshot: commissionRate,
                    calculated_commission: commission,
                    commission_status: 'pending'
                };
            });

            await prisma.appointment_services.createMany({
                data: servicesPayload
            });
        }

        // Resources...
        if (resourceIds && resourceIds.length > 0) {
            await prisma.appointment_resources.createMany({
                data: resourceIds.map(rid => ({
                    appointment_id: appointment.id,
                    resource_id: rid
                }))
            });
        }

        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAppointments = async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;

        let dateFilter = {};

        if (startDate && endDate) {
            // Range filter (month view)
            dateFilter = {
                start_time: {
                    gte: parseISO(startDate),
                    lte: parseISO(endDate)
                }
            };
        } else if (date) {
            // Single day filter (day view)
            const searchDate = parseISO(date);
            const startOfDay = new Date(searchDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(searchDate);
            endOfDay.setHours(23, 59, 59, 999);

            dateFilter = {
                start_time: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            };
        }

        const appointments = await prisma.appointments.findMany({
            where: {
                status: { not: 'cancelled' },
                ...dateFilter
            },
            include: {
                customers: { select: { name: true } },
                pets: { select: { name: true, breed: true } },
                services: { include: { services: true } }
            }
        });
        res.json(appointments);
    } catch (error) {
        console.error('Error listing appointments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.appointments.update({
            where: { id },
            data: { status: 'cancelled' }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error eliminating appointment:', error);
        res.status(500).json({ error: 'Error cancelling appointment' });
    }
};

export const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, startTime, serviceIds, professionalId, conditions } = req.body;

        // 1. Get existing to calculate duration
        const existing = await prisma.appointments.findUnique({
            where: { id }
        });

        if (!existing) return res.status(404).json({ error: 'Appointment not found' });

        const oldStart = existing.start_time;
        const oldEnd = existing.end_time;
        const durationMs = oldEnd.getTime() - oldStart.getTime();

        // 2. Calculate new End Time
        const newStart = parseISO(startTime); // Ensure this is full ISO

        let newEnd;
        if (req.body.endTime) {
            newEnd = parseISO(req.body.endTime);
        } else {
            newEnd = new Date(newStart.getTime() + durationMs);
        }

        // 3. Update appointment base data
        // 3. Update appointment base data
        // Validação de data retroativa na edição também
        if (newStart < new Date()) {
            return res.status(400).json({ error: 'Não é possível agendar em datas retroativas.' });
        }

        // 3. Update appointment base data
        // Validação de data retroativa na edição
        const editStart = parseISO(startTime); // usar variável diferente para garantir
        if (editStart < new Date()) {
            // Permitir se a data não foi alterada (caso de update de outros campos em agendamento passado)? 
            // O usuário disse "não deve ser possível agendar de forma alguma datas retroativas". Assumir estrito.
            // Mas se eu estou editando uma nota de um agendamento antigo?
            // Melhor verificar se a data mudou.
            if (existing.start_time.getTime() !== editStart.getTime()) {
                return res.status(400).json({ error: 'Não é possível para datas retroativas.' });
            }
        }

        // Se a data mudou para passado, bloqueia. Se manteve a mesma (que já era passado), permite (apenas edição de notas).
        // Simplificação: Se a data nova é < agora, bloqueia.
        if (newStart < new Date() && existing.start_time.toISOString() !== newStart.toISOString()) {
            return res.status(400).json({ error: 'Não é possível mover para datas retroativas.' });
        }


        const updated = await prisma.appointments.update({
            where: { id },
            data: {
                date: parseISO(date),
                start_time: newStart,
                end_time: newEnd,
                conditions: conditions || existing.conditions
            }
        });

        // 4. Update services if provided
        // 4. Update services if provided
        if (serviceIds && serviceIds.length > 0 && professionalId) {
            // Delete existing services
            await prisma.appointment_services.deleteMany({
                where: { appointment_id: id }
            });

            // Recalcular comissões
            const professional = await prisma.users.findUnique({
                where: { id: professionalId },
                select: { commission_rate: true }
            });
            const commissionRate = Number(professional?.commission_rate || 0);

            const servicesData = await prisma.services.findMany({
                where: { id: { in: serviceIds } },
                select: { id: true, base_price: true }
            });
            const serviceMap = new Map(servicesData.map(s => [s.id, Number(s.base_price)]));

            const servicesPayload = serviceIds.map(sid => {
                const price = serviceMap.get(sid) || 0;
                const commission = price * (commissionRate / 100);
                return {
                    appointment_id: id,
                    service_id: sid,
                    professional_id: professionalId,
                    price: price,
                    commission_rate_snapshot: commissionRate,
                    calculated_commission: commission,
                    commission_status: 'pending'
                };
            });

            await prisma.appointment_services.createMany({
                data: servicesPayload
            });
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: error.message });
    }
};
