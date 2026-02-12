const { Connection, Request } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true
    }
};

const conn = new Connection(config);

conn.on('connect', (err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }

    console.log('Connected. Listing all tables...');

    const req = new Request(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'",
        (err, rowCount, rows) => {
            if (err) {
                console.error('Query failed:', err);
            } else {
                console.log(`Found ${rowCount} tables:`);
                rows.forEach(r => console.log('  - ' + r[0].value));
            }
            conn.close();
        }
    );

    conn.execSql(req);
});

conn.connect();
