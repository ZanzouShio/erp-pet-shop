import { prisma } from '../db.js';

export const listGroomers = async (req, res) => {
    try {
        const groomers = await prisma.users.findMany({
            where: { is_groomer: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                seniority_level: true,
                speed_factor: true,
                commission_rate: true,
                is_active: true
            }
        });
        res.json(groomers);
    } catch (error) {
        console.error('Error listing groomers:', error);
        res.status(500).json({ error: 'Erro ao listar profissionais' });
    }
};

import crypto from 'crypto';

export const createGroomer = async (req, res) => {
    try {
        const { name, email, seniority_level, speed_factor, commission_rate } = req.body;

        // Check email
        const existing = await prisma.users.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Este email já está cadastrado.' });
        }

        // Generate Random Password for "No Login" Users
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync('AutoPass123!', salt, 1000, 64, 'sha512').toString('hex');
        const password_hash = `${salt}:${hash}`;

        const groomer = await prisma.users.create({
            data: {
                name,
                email,
                password_hash, // Stored safely even if unused
                role: 'ADMIN',
                is_groomer: true,
                seniority_level: seniority_level || 'junior',
                speed_factor: speed_factor || 1.0,
                commission_rate: commission_rate || 0,
                is_active: true
            }
        });

        res.status(201).json(groomer);
    } catch (error) {
        console.error('Error creating groomer:', error); // Log full error including DB constraints
        const message = error.meta?.target ? `Erro: Dado duplicado (${error.meta.target})` : 'Erro ao criar profissional';
        res.status(500).json({ error: message, details: error.message });
    }
};

export const updateGroomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, seniority_level, speed_factor, commission_rate, is_active } = req.body;

        const groomer = await prisma.users.update({
            where: { id },
            data: {
                name,
                email,
                seniority_level,
                speed_factor,
                commission_rate,
                is_active,
                // Ensure they stay groomers
                is_groomer: true
            }
        });

        res.json(groomer);
    } catch (error) {
        console.error('Error updating groomer:', error);
        res.status(500).json({ error: 'Erro ao atualizar profissional' });
    }
};

export const deleteGroomer = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete usually, or hard delete if no constraints
        // For now, toggle is_active or is_groomer logic?
        // Let's hard delete but catch constraints.

        // Actually, safer to Soft Delete (is_active = false)
        await prisma.users.update({
            where: { id },
            data: { is_active: false, is_groomer: false } // Remove from groomer list
        });

        res.json({ message: 'Profissional removido com sucesso' });
    } catch (error) {
        console.error('Error deleting groomer:', error);
        res.status(500).json({ error: 'Erro ao remover profissional' });
    }
};
