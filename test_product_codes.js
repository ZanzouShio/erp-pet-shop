const API_URL = 'http://localhost:3001/api';

async function testProductCodes() {
    try {
        console.log('1. Creating product with codes...');
        const newProduct = {
            name: 'Produto Teste API ' + Date.now(),
            description: 'Teste de API',
            sale_price: 10.00,
            cost_price: 5.00,
            stock_quantity: 100,
            internal_code: 'INT-API-001',
            sku: 'SKU-API-001',
            category_id: null
        };

        // Fetch a category first
        const catRes = await fetch(`${API_URL}/categories`);
        const categories = await catRes.json();
        if (categories.length > 0) {
            newProduct.category_id = categories[0].id;
        }

        const createRes = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create failed: ${createRes.status} ${err}`);
        }

        const createData = await createRes.json();
        const createdProduct = createData.product;

        console.log('Created Product ID:', createdProduct.id);
        console.log('Created Internal Code:', createdProduct.internal_code);
        console.log('Created SKU:', createdProduct.sku);

        if (createdProduct.internal_code !== newProduct.internal_code || createdProduct.sku !== newProduct.sku) {
            console.error('❌ FAILED: Created product does not match sent codes.');
        } else {
            console.log('✅ SUCCESS: Created product has correct codes.');
        }

        console.log('\n2. Fetching all products to verify persistence...');
        const listRes = await fetch(`${API_URL}/products`);
        const products = await listRes.json();
        const foundProduct = products.find(p => p.id === createdProduct.id);

        if (foundProduct) {
            console.log('Found Product in List:', foundProduct.name);
            console.log('List Internal Code:', foundProduct.internal_code);
            console.log('List SKU:', foundProduct.sku);

            if (foundProduct.internal_code === newProduct.internal_code && foundProduct.sku === newProduct.sku) {
                console.log('✅ SUCCESS: Product in list has correct codes.');
            } else {
                console.error('❌ FAILED: Product in list missing or incorrect codes.');
                console.log('Expected:', newProduct.internal_code, newProduct.sku);
                console.log('Actual:', foundProduct.internal_code, foundProduct.sku);
            }
        } else {
            console.error('❌ FAILED: Created product not found in list.');
        }

        console.log('\n3. Updating product codes...');
        const updateData = {
            ...newProduct,
            internal_code: 'INT-API-UPDATED',
            sku: 'SKU-API-UPDATED'
        };

        const updateRes = await fetch(`${API_URL}/products/${createdProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (!updateRes.ok) {
            const err = await updateRes.text();
            throw new Error(`Update failed: ${updateRes.status} ${err}`);
        }

        // Fetch again to verify update
        const listRes2 = await fetch(`${API_URL}/products`);
        const products2 = await listRes2.json();
        const foundProductUpdated = products2.find(p => p.id === createdProduct.id);

        if (foundProductUpdated) {
            console.log('Updated List Internal Code:', foundProductUpdated.internal_code);
            console.log('Updated List SKU:', foundProductUpdated.sku);

            if (foundProductUpdated.internal_code === 'INT-API-UPDATED' && foundProductUpdated.sku === 'SKU-API-UPDATED') {
                console.log('✅ SUCCESS: Product update persisted correct codes.');
            } else {
                console.error('❌ FAILED: Product update did not persist codes.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testProductCodes();
