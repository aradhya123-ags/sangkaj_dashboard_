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

const probe = () => {
    const conn = new Connection(config);
    conn.on('connect', (err) => {
        if (err) {
            console.error(err);
            return;
        }
        const sql = "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'login_details'";
        const req = new Request(sql, (err, rowCount, rows) => {
            if (err) console.error(err);
            else rows.forEach(r => console.log(`${r[0].value}: ${r[1].value} (${r[2].value})`));
            conn.close();
        });
        conn.execSql(req);
    });
    conn.connect();
};

probe();
