
const https = require('https');

async function fetchSheet(nameOrIndex) {
    return new Promise((resolve, reject) => {
        https.get(`https://opensheet.elk.sh/1Tdxx6a3nKK8JmQvL8BwVzJhbFalWcHEAgd07cmt9uG0/${nameOrIndex}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(`Error parsing ${nameOrIndex}: ${e.message}`);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    const sheets = ['Horarios', 'Servicios', 'Contacto', '1', '2', '3', '4', '5'];
    for (const sheet of sheets) {
        try {
            const data = await fetchSheet(sheet);
            console.log(`--- Sheet: ${sheet} (Length: ${data.length || 'N/A'}) ---`);
            if (Array.isArray(data) && data.length > 0) {
                console.log(JSON.stringify(data.slice(0, 3), null, 2));
            } else {
                console.log(data);
            }
        } catch(e) {
            console.log(`--- Sheet: ${sheet} FAILED ---`);
        }
    }
}

main();
