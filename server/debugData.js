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

const connection = new Connection(config);
connection.on('connect', (err) => {
    if (err) { console.error(err); return; }
    // Check for Oct 2025 specifically with different formats
    const query = `
        SELECT 
            [MonthYear], 
            MONTH([MonthYear]) as M, 
            YEAR([MonthYear]) as Y, 
            COUNT(*) as Count 
        FROM [Sangkaj].[dbo].[Targets] 
        GROUP BY [MonthYear]
    `;
    const request = new Request(query, (err, rowCount, rows) => {
        if (err) console.error(err);
        else {
            console.log('Detailed Stats:');
            rows.forEach(row => {
                console.log(`Raw: ${row[0].value} | Month: ${row[1].value} | Year: ${row[2].value} | Count: ${row[3].value}`);
            });
        }
        connection.close();
    });
    connection.execSql(request);
});
connection.connect();
