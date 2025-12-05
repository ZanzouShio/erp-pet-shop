import fetch from 'node-fetch';

async function main() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Testing with date:', today);

        const response = await fetch(`http://localhost:3001/api/invoices?startDate=${today}&endDate=${today}`);
        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Count:', data.length);
        if (data.length === 0) {
            console.log('No invoices found.');
        } else {
            console.log('First invoice date:', data[0].date);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
