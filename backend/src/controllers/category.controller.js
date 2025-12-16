import pool from '../db.js';

export const getAllCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, description, is_active, created_at, updated_at,
                   (SELECT COUNT(*) FROM products WHERE category_id = product_categories.id AND is_active = true) as products_count
            FROM product_categories
            WHERE is_active = true
            ORDER BY name
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validações
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }

        if (name.length > 100) {
            return res.status(400).json({ error: 'Nome da categoria deve ter no máximo 100 caracteres' });
        }

        // Verificar se já existe categoria com mesmo nome
        const existingCategory = await pool.query(
            'SELECT id FROM product_categories WHERE LOWER(name) = LOWER($1) AND is_active = true',
            [name.trim()]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
        }

        // Criar categoria
        const result = await pool.query(`
            INSERT INTO product_categories (name, description, is_active, created_at, updated_at)
            VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, name, description, is_active, created_at, updated_at
        `, [name.trim(), description?.trim() || null]);

        res.status(201).json({
            message: 'Categoria criada com sucesso',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erro ao criar categoria:', error);
        res.status(500).json({ error: 'Erro ao criar categoria: ' + error.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Validações
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }

        if (name.length > 100) {
            return res.status(400).json({ error: 'Nome da categoria deve ter no máximo 100 caracteres' });
        }

        // Verificar se categoria existe
        const categoryExists = await pool.query(
            'SELECT id FROM product_categories WHERE id = $1',
            [id]
        );

        if (categoryExists.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        // Verificar se já existe outra categoria com mesmo nome
        const existingCategory = await pool.query(
            'SELECT id FROM product_categories WHERE LOWER(name) = LOWER($1) AND id != $2 AND is_active = true',
            [name.trim(), id]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
        }

        // Atualizar categoria
        const result = await pool.query(`
            UPDATE product_categories 
            SET name = $1, 
                description = $2, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, name, description, is_active, created_at, updated_at
        `, [name.trim(), description?.trim() || null, id]);

        res.json({
            message: 'Categoria atualizada com sucesso',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar categoria:', error);
        res.status(500).json({ error: 'Erro ao atualizar categoria: ' + error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se categoria existe
        const categoryExists = await pool.query(
            'SELECT id, name FROM product_categories WHERE id = $1',
            [id]
        );

        if (categoryExists.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        // Verificar se existe produtos usando esta categoria
        const productsUsingCategory = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND is_active = true',
            [id]
        );

        const productsCount = parseInt(productsUsingCategory.rows[0].count);

        if (productsCount > 0) {
            return res.status(400).json({
                error: `Não é possível excluir esta categoria. Existem ${productsCount} produto(s) usando esta categoria.`
            });
        }

        // Desativar categoria (soft delete)
        const result = await pool.query(`
            UPDATE product_categories 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, name
        `, [id]);

        res.json({
            message: 'Categoria desativada com sucesso',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erro ao deletar categoria:', error);
        res.status(500).json({ error: 'Erro ao deletar categoria: ' + error.message });
    }
};
