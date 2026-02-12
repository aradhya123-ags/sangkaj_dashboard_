const { Connection, Request, TYPES } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: {
        type: 'default',
        options: {
            userName: 'sangkaj',
            password: 'sangkaj7'
        }
    },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true
    }
};

const connection = new Connection(config);
connection.on('connect', (err) => {
    if (err) { console.error(err); return; }
    const request = new Request("SELECT [MonthYear], COUNT(*) as count FROM [Sangkaj].[dbo].[Targets] GROUP BY [MonthYear]", (err, rowCount, rows) => {
        if (err) console.error(err);
        else {
            console.log('SQL Server Counts:');
            rows.forEach(row => {
                console.log(`${row[0].value}: ${row[1].value}`);
            });
        }
        connection.close();
    });
    connection.execSql(request);
});
connection.connect();
