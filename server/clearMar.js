const { Connection, Request, TYPES } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 60000
    }
};

const connection = new Connection(config);

connection.on('connect', (err) => {
    if (err) {
        console.error('Connection Error:', err);
        return;
    }
    console.log('Connected - Deleting ALL March 2025 records...');

    const deleteRequest = new Request(
        `DELETE FROM [Sangkaj].[dbo].[Targets] WHERE MONTH([MonthYear]) = 3 AND YEAR([MonthYear]) = 2025`,
        (err, rowCount) => {
            if (err) console.error('Delete Error:', err);
            else console.log(`SUCCESS: DELETED ${rowCount} rows for March 2025`);
            connection.close();
        }
    );
    connection.execSql(deleteRequest);
});

connection.on('error', (err) => {
    console.error('Connection Error Event:', err);
});

connection.connect();
