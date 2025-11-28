import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function simulateFrontendRequest() {
    // Simulando o filtro da imagem do usuário: 27/11/2025 a 31/01/2026
    const params = new URLSearchParams({
        start_date: '2025-11-27',
        end_date: '2026-01-31'
    });

    console.log(`🔍 Simulando requisição: GET ${API_URL}/accounts-receivable?${params}`);

    try {
        const response = await fetch(`${API_URL}/accounts-receivable?${params}`);
        const data = await response.json();

        console.log(`📊 Status: ${response.status}`);
        console.log(`📦 Dados recebidos: ${data.length} registros`);

        if (data.length > 0) {
            console.log('✅ Primeiros registros:', data.slice(0, 3));
        } else {
            console.log('⚠️ Nenhum registro retornado!');
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

simulateFrontendRequest();
