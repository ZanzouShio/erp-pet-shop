import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function reproduceError() {
    try {
        // 1. Pegar um título pendente
        const listRes = await fetch(`${API_URL}/accounts-receivable?status=pending`);
        const titles = await listRes.json();

        if (titles.length === 0) {
            console.log('⚠️ Nenhum título pendente para testar.');
            return;
        }

        const title = titles[0];
        console.log(`🎯 Tentando baixar título: ${title.description} (ID: ${title.id})`);

        // 2. Tentar baixar
        const res = await fetch(`${API_URL}/accounts-receivable/${title.id}/receive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_date: new Date() })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('❌ Erro retornado pela API:', JSON.stringify(errorData, null, 2));
        } else {
            console.log('✅ Sucesso inesperado!');
        }

    } catch (error) {
        console.error('❌ Erro no script:', error);
    }
}

reproduceError();
