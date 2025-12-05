import fetch from 'node-fetch';

async function main() {
    try {
        const response = await fetch('http://localhost:3001/api/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                saleId: '25d56af0-72ed-449f-b465-049b72d533a6',
                type: 'NFC-e'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
