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

const runSql = (sql) => {
    return new Promise((resolve, reject) => {
        const conn = new Connection(config);
        conn.on('connect', (err) => {
            if (err) return reject(err);
            const req = new Request(sql, (err, rowCount, rows) => {
                conn.close();
                if (err) return reject(err);
                resolve(rows);
            });
            conn.execSql(req);
        });
        conn.connect();
    });
};

const monthMap = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };

const migrate = async () => {
    try {
        console.log('Fetching distinct MonthYear values...');
        const conn = new Connection(config);

        const getDistinct = () => new Promise((resolve, reject) => {
            conn.on('connect', (err) => {
                if (err) return reject(err);
                const req = new Request("SELECT DISTINCT MonthYear FROM [Sangkaj].[dbo].[Targets]", (err, rowCount, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r[0].value));
                });
                conn.execSql(req);
            });
            conn.connect();
        });

        const distinctValues = await getDistinct();
        console.log('Updating values:', distinctValues);

        for (const val of distinctValues) {
            if (val && val.includes('-')) {
                const parts = val.split('-');
                if (parts.length === 2) {
                    const month = parts[0];
                    const year = parts[1];
                    const m = monthMap[month];
                    const y = parseInt(year);

                    if (m && y) {
                        const lastDateObj = new Date(Date.UTC(y, m, 0));
                        const totalDays = lastDateObj.getUTCDate();
                        const newVal = `${totalDays} ${month} ${year}`;

                        console.log(`Migrating: "${val}" -> "${newVal}"`);

                        await new Promise((resolve, reject) => {
                            const conn2 = new Connection(config);
                            conn2.on('connect', (err) => {
                                if (err) return reject(err);
                                const upReq = new Request(
                                    `UPDATE [Sangkaj].[dbo].[Targets] SET [MonthYear] = @newVal WHERE [MonthYear] = @oldVal`,
                                    (err) => {
                                        conn2.close();
                                        if (err) reject(err);
                                        else resolve();
                                    }
                                );
                                const tedious = require('tedious');
                                upReq.addParameter('newVal', tedious.TYPES.NVarChar, newVal);
                                upReq.addParameter('oldVal', tedious.TYPES.NVarChar, val);
                                conn2.execSql(upReq);
                            });
                            conn2.connect();
                        });
                    }
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
