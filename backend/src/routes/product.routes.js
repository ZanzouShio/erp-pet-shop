import { Router } from 'express';
import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Categorias (rota específica deve vir antes de :id se fosse o caso, mas aqui é outro endpoint base no index antigo, 
// porém no app.js definimos /api/products. 
// O endpoint antigo era /api/categories. 
// VOU CRIAR UM ARQUIVO SEPARADO PARA CATEGORIAS OU MANTER AQUI?
// O app.js define app.use('/api/products', productRoutes);
// Se eu colocar router.get('/categories', ...) aqui, vira /api/products/categories.
// No index.js era /api/categories.
// MUDANÇA: Vou criar um category.routes.js ou ajustar no app.js.
// Para simplificar, vou adicionar a rota de categorias no app.js apontando para este arquivo também? Não.
// Melhor: Criar category.routes.js se for complexo. Mas é só um GET.
// Vou manter a consistência com o index.js antigo: GET /api/categories.
// Então preciso de um category.routes.js ou adicionar no app.js.
// Vou adicionar no app.js uma rota para categories usando o productController por enquanto.
// Mas espere, o app.js não tem categoryRoutes.
// Vou adicionar export getCategories no controller e criar uma rota específica no app.js ou aqui.
// Se eu deixar aqui, tenho que mudar o frontend para /api/products/categories? Não quero quebrar o frontend.
// Então vou criar src/routes/category.routes.js
export default router;
