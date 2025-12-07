export type SeniorityLevel = 'JUNIOR' | 'MID' | 'SENIOR';
export type CoatType = 'curto' | 'longo' | 'duplo';
export type BreedSize = 'P' | 'M' | 'G' | 'GIG';

interface Professional {
    id: string;
    name: string;
    seniority: SeniorityLevel;
    speedFactor: number; // e.g., 1.2 (Junior takes 20% longer) or 0.8 (Senior is 20% faster)
}

interface Pet {
    id: string;
    name: string;
    size: BreedSize;
    coatType: CoatType;
    conditions: string[]; // e.g., ['matted', 'aggressive']
}

interface ServiceMatrixEntry {
    serviceId: string;
    baseDurationMinutes: number; // e.g., 30
    breedSize: BreedSize;
    coatType: CoatType;
}

interface Service {
    id: string;
    name: string;
}

/**
 * Calculates the estimated duration for a grooming appointment.
 * Core Algorithm: (Base Duration * Professional Speed Factor) + Condition Penalties
 */
export function calculateAppointmentDuration(
    services: Service[],
    matrix: ServiceMatrixEntry[], // Pre-filtered for this Pet's size/coat
    pet: Pet,
    professional: Professional
): { totalDuration: number; breakdown: any[] } {

    let totalMinutes = 0;
    const breakdown = [];

    // 1. Calculate Base Time per Service
    for (const service of services) {
        // Find matching matrix entry
        const matrixEntry = matrix.find(m =>
            m.serviceId === service.id &&
            m.breedSize === pet.size &&
            m.coatType === pet.coatType
        );

        if (!matrixEntry) {
            console.warn(`No matrix entry found for service ${service.name} (${pet.size}/${pet.coatType}). Using default 30m.`);
        }

        const baseDuration = matrixEntry ? matrixEntry.baseDurationMinutes : 30;

        // 2. Apply Speed Factor
        // Junior (1.2) -> 30 * 1.2 = 36 mins
        // Senior (0.8) -> 30 * 0.8 = 24 mins
        const adjustedDuration = Math.ceil(baseDuration * professional.speedFactor);

        breakdown.push({
            service: service.name,
            base: baseDuration,
            adjusted: adjustedDuration,
            factor: professional.speedFactor
        });

        totalMinutes += adjustedDuration;
    }

    // 3. Apply Condition Penalties
    // These are additive, not multiplicative (usually)
    if (pet.conditions.includes('matted')) { // "nós/embolado"
        const penalty = 30;
        totalMinutes += penalty;
        breakdown.push({ condition: 'matted', penalty });
    }

    if (pet.conditions.includes('aggressive')) {
        const penalty = 20; // Extra time for handling
        totalMinutes += penalty;
        breakdown.push({ condition: 'aggressive', penalty });
    }

    if (pet.conditions.includes('elderly')) {
        const penalty = 15; // Extra care
        totalMinutes += penalty;
        breakdown.push({ condition: 'elderly', penalty });
    }

    return { totalDuration: totalMinutes, breakdown };
}
