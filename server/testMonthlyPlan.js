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

    console.log('Connected. Testing Monthly Plan query...');

    const req = new Request(
        "SELECT [MonthYear], COUNT(*) as count FROM [Sangkaj].[dbo].[Monthly Plan] GROUP BY [MonthYear]",
        (err, rowCount, rows) => {
            if (err) {
                console.error('Query failed:', err);
                console.error('Error details:', err.message);
            } else {
                console.log(`Query successful! Found ${rowCount} groups:`);
                rows.forEach(r => {
                    console.log(`  ${r[0].value}: ${r[1].value} records`);
                });
            }
            conn.close();
        }
    );

    conn.execSql(req);
});

conn.connect();
