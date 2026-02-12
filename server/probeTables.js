const { Connection, Request } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true
    }
};

const probe = () => {
    const conn = new Connection(config);
    conn.on('connect', (err) => {
        if (err) {
            console.error('Connection failed:', err);
            return;
        }
        console.log('Connected');

        const sql = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%user%'";
        const req = new Request(sql, (err, rowCount, rows) => {
            if (err) {
                console.error('Query error:', err.message);
            } else {
                console.log(`Found ${rowCount} tables:`);
                rows.forEach(r => console.log(' - ' + r[0].value));
            }
            conn.close();
        });
        conn.execSql(req);
    });
    conn.connect();
};

probe();
