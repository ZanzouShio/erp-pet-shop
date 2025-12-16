import { Router } from 'express';
import { getCategories } from '../controllers/product.controller.js';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/category.controller.js';

const router = Router();

// Rota principal usa nova função com contagem de produtos
router.get('/', getAllCategories);

// Novas rotas CRUD
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
