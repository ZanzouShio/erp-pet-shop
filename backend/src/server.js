import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log('');
    console.log('🐾 ====================================');
    console.log('   ERP PET SHOP - BACKEND API (v2)');
    console.log('====================================');
    console.log(`🚀 Servidor: http://localhost:${PORT}`);
    console.log(`📦 Produtos: http://localhost:${PORT}/api/products`);
    console.log(`💰 Vendas: http://localhost:${PORT}/api/sales`);
    console.log('====================================');
    console.log('');
});
