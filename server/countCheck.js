const { Connection, Request } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true,
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
    console.log('Connected to SQL Server');

    const request = new Request(
        `SELECT MONTH([MonthYear]) as M, YEAR([MonthYear]) as Y, COUNT(*) as Cnt 
         FROM [Sangkaj].[dbo].[Targets] 
         GROUP BY MONTH([MonthYear]), YEAR([MonthYear])`,
        (err, rowCount, rows) => {
            if (err) console.error('Query Error:', err);
            else {
                console.log('SQL Server Record Counts:');
                rows.forEach(row => {
                    console.log(`Month: ${row[0].value}, Year: ${row[1].value}, Count: ${row[2].value}`);
                });
            }
            connection.close();
        }
    );
    connection.execSql(request);
});

connection.on('error', (err) => {
    console.error('Connection Error Event:', err);
});

connection.connect();
