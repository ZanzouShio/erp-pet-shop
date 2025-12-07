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
            await prisma.appointment_services.createMany({
                data: serviceIds.map(sid => ({
                    appointment_id: appointment.id,
                    service_id: sid,
                    professional_id: professionalId, // Main pro for all (simplified)
                    price: 0 // Fetch actual price if needed
                }))
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
        let where = { status: { not: 'cancelled' } };

        if (date) {
            const searchDate = parseISO(date);
            // Full day search
            // where.start_time = ... range ...
            // Simplified: use DB date cast if available or range
            // For now, let's filter purely by time range for the day
            // const s = startOfDay(searchDate); const e = endOfDay(searchDate);
        }

        const appointments = await prisma.appointments.findMany({
            where: {
                status: { not: 'cancelled' },
                ...(startDate && endDate ? {
                    start_time: {
                        gte: parseISO(startDate),
                        lte: parseISO(endDate)
                    }
                } : {})
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
        const { date, startTime } = req.body;

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

        // 3. Update
        const updated = await prisma.appointments.update({
            where: { id },
            data: {
                date: parseISO(date),
                start_time: newStart,
                end_time: newEnd
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: error.message });
    }
};
