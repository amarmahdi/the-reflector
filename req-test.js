const fetch = require('node-fetch');
fetch('https://instances.cobalt.tools/instances.json', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0' }
}).then(res => res.json()).then(data => console.log(data.length)).catch(console.error);
