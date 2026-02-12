const { Connection, Request } = require('tedious');

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
    if (err) {
        console.error(err);
        return;
    }
    const request = new Request("SELECT TOP 1 [MonthYear] FROM [Sangkaj].[dbo].[Targets]", (err, rowCount, rows) => {
        if (err) console.error(err);
        else if (rows.length > 0) {
            console.log('Column Name:', rows[0][0].metadata.colName);
            console.log('Type Name:', rows[0][0].metadata.type.name);
            console.log('Value:', rows[0][0].value);
            console.log('Value Type:', typeof rows[0][0].value);
        }
        connection.close();
    });
    connection.execSql(request);
});
connection.connect();
