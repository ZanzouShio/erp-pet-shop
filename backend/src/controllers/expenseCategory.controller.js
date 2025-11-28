import pool from '../db.js';

export const expenseCategoryController = {
    // Listar todas as categorias
    async list(req, res) {
        try {
            const result = await pool.query('SELECT * FROM expense_categories ORDER BY name');
            res.json(result.rows);
        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            res.status(500).json({ error: 'Erro ao listar categorias' });
        }
    },

    // Criar nova categoria
    async create(req, res) {
        const { name, description, color } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO expense_categories (name, description, color) VALUES ($1, $2, $3) RETURNING *',
                [name, description, color]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            res.status(500).json({ error: 'Erro ao criar categoria' });
        }
    },

    // Atualizar categoria
    async update(req, res) {
        const { id } = req.params;
        const { name, description, color } = req.body;
        try {
            const result = await pool.query(
                'UPDATE expense_categories SET name = $1, description = $2, color = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
                [name, description, color, id]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            res.status(500).json({ error: 'Erro ao atualizar categoria' });
        }
    },

    // Excluir categoria
    async delete(req, res) {
        const { id } = req.params;
        try {
            // Verificar se está em uso
            const check = await pool.query('SELECT id FROM accounts_payable WHERE category_id = $1 LIMIT 1', [id]);
            if (check.rowCount > 0) {
                return res.status(400).json({ error: 'Categoria em uso por contas a pagar' });
            }

            const result = await pool.query('DELETE FROM expense_categories WHERE id = $1 RETURNING id', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }
            res.json({ message: 'Categoria excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            res.status(500).json({ error: 'Erro ao excluir categoria' });
        }
    }
};
