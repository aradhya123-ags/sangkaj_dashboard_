const { Connection, Request } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true,
        connectTimeout: 30000
    }
};

console.log('Attempting to connect to SQL Server...');
const connection = new Connection(config);

connection.on('connect', (err) => {
    if (err) {
        console.error('Connection failed:', err);
    } else {
        console.log('Connected successfully!');
        const request = new Request('SELECT TOP 1 [Material Code] FROM [Sangkaj].[dbo].[Targets]', (err, rowCount) => {
            if (err) {
                console.error('Query failed:', err);
            } else {
                console.log('Query successful, row count:', rowCount);
            }
            connection.close();
            process.exit(0);
        });
        connection.execSql(request);
    }
});

connection.on('error', (err) => {
    console.error('Connection error event:', err);
});

connection.connect();
