const { Connection, Request } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true
    }
};

const runSql = (sql) => {
    return new Promise((resolve, reject) => {
        const conn = new Connection(config);
        conn.on('connect', (err) => {
            if (err) return reject(err);
            const req = new Request(sql, (err) => {
                conn.close();
                if (err) return reject(err);
                resolve();
            });
            conn.execSql(req);
        });
        conn.connect();
    });
};

const transformDb = async () => {
    try {
        console.log('1. Dropping [Working Days] column...');
        try {
            await runSql("ALTER TABLE [Sangkaj].[dbo].[Targets] DROP COLUMN [Working Days]");
            console.log('--- Success: Dropped [Working Days]');
        } catch (e) {
            console.log('--- Skip: [Working Days] already gone or error:', e.message);
        }

        console.log('2. Preparing to change MonthYear format...');
        // First, add a temporary column
        await runSql("ALTER TABLE [Sangkaj].[dbo].[Targets] ADD [MonthYearTemp] NVARCHAR(20)");

        // Update it based on old DATE values
        // Note: SQL Server DATENAME/FORMAT varies, but we can do a simple map
        await runSql(`
            UPDATE [Sangkaj].[dbo].[Targets] 
            SET [MonthYearTemp] = 
                CASE MONTH([MonthYear])
                    WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Apr'
                    WHEN 5 THEN 'May' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug'
                    WHEN 9 THEN 'Sep' WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
                END + '-' + CAST(YEAR([MonthYear]) AS NVARCHAR(4))
            WHERE [MonthYear] IS NOT NULL
        `);

        // Drop old column and rename temp
        await runSql("ALTER TABLE [Sangkaj].[dbo].[Targets] DROP COLUMN [MonthYear]");
        await runSql("EXEC sp_rename 'Sangkaj.dbo.Targets.MonthYearTemp', 'MonthYear', 'COLUMN'");

        console.log('--- Success: MonthYear transformed to NVARCHAR(20) formatted as Mon-YYYY');
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
};

transformDb();
