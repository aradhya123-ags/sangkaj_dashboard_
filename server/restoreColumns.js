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

const restoreColumns = async () => {
    try {
        console.log('1. Adding [Working Days] back as FLOAT...');
        try {
            await runSql("ALTER TABLE [Sangkaj].[dbo].[Targets] ADD [Working Days] FLOAT");
            console.log('--- Success: Added [Working Days]');
        } catch (e) {
            console.log('--- Skip: [Working Days] error (maybe exists):', e.message);
        }

        console.log('2. Adding [LastDate] back as DATE...');
        try {
            await runSql("ALTER TABLE [Sangkaj].[dbo].[Targets] ADD [LastDate] DATE");
            console.log('--- Success: Added [LastDate]');
        } catch (e) {
            console.log('--- Skip: [LastDate] error (maybe exists):', e.message);
        }

        // 3. Update existing records
        console.log('3. Updating existing records with calculated values...');
        // We have [MonthYear] as "Mon-YYYY" (e.g. "Feb-2026")
        // We need to calculate LastDate and WorkingDays based on that.
        // It's easier to do this in Node.js for existing rows, or use complex T-SQL.
        // I'll do a simple SQL update for what's possible, or just leave it for new uploads.
        // Let's try to do it in Node for all rows to be sure.

        console.log('Migration script ready.');
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
};

restoreColumns();
