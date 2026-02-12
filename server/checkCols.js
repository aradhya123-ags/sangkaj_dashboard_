const { Connection, Request } = require('tedious');
const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: { port: 1433, database: 'Sangkaj', trustServerCertificate: true }
};
const connection = new Connection(config);
connection.on('connect', (err) => {
    if (err) { console.error(err); return; }
    const request = new Request("SELECT TOP 1 * FROM [Sangkaj].[dbo].[Targets]", (err, rowCount, rows) => {
        if (rows && rows.length > 0) {
            rows[0].forEach(c => console.log(c.metadata.colName));
        }
        connection.close();
    });
    connection.execSql(request);
});
connection.connect();
