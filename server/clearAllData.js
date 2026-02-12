const { Connection, Request } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 120000
    }
};

const connection = new Connection(config);

connection.on('connect', (err) => {
    if (err) {
        console.error('Connection Error:', err);
        return;
    }
    console.log('Connected to SQL Server. Deleting all records...');

    const request = new Request(
        "DELETE FROM [Sangkaj].[dbo].[Monthly Plan]",
        (err, rowCount) => {
            if (err) {
                console.error('Delete Error:', err);
            } else {
                console.log(`Successfully deleted ${rowCount} records from the database.`);
            }
            connection.close();
        }
    );

    connection.execSql(request);
});

connection.connect();
