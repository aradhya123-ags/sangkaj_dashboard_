const { Connection, Request, TYPES } = require('tedious');
require('dotenv').config();

const config = {
    server: process.env.DB_HOST || '103.108.117.81',
    authentication: { type: 'default', options: { userName: process.env.DB_USER || 'sangkaj', password: process.env.DB_PASSWORD || 'sangkaj7' } },
    options: {
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_NAME || 'Sangkaj',
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true,
        connectTimeout: 30000,
        requestTimeout: 300000  // 5 minutes for large uploads
    }
};

const execQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        console.log('SQL: Starting connection for query...');
        const connection = new Connection(config);
        connection.on('connect', (err) => {
            if (err) {
                console.error('SQL: Connection failed:', err);
                connection.close();
                return reject(err);
            }
            console.log('SQL: Connected. Executing query...');
            const request = new Request(query, (err, rowCount, rows) => {
                if (err) {
                    console.error('SQL: Query error:', err);
                    connection.close();
                    return reject(err);
                }
                const results = rows ? rows.map(r => {
                    const obj = {};
                    r.forEach(col => { obj[col.metadata.colName] = col.value; });
                    return obj;
                }) : [];
                console.log('SQL: Query done, rows:', results.length);
                connection.close();
                resolve(results);
            });
            params.forEach(p => request.addParameter(p.name, p.type, p.value));
            connection.execSql(request);
        });
        connection.on('error', (err) => { console.error('SQL Error event:', err); connection.close(); });
        connection.connect();
    });
};

const formatDateForSql = (month, year) => {
    const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    const m = monthMap[month];
    const lastDay = new Date(Date.UTC(parseInt(year), m + 1, 0));
    return lastDay.toISOString().split('T')[0];
};

const getDemandFromSql = (month, year) => {
    const monthMap = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
    const m = monthMap[month];
    const y = parseInt(year);
    const lastDay = new Date(Date.UTC(y, m, 0));
    const formattedMY = `${lastDay.getUTCDate()} ${month} ${year}`;

    return execQuery(
        `SELECT * FROM [Sangkaj].[dbo].[Monthly Plan] WHERE [MonthYear] = @my`,
        [{ name: 'my', type: TYPES.NVarChar, value: formattedMY }]
    );
};

const replaceDemandInSql = async (month, year, data) => {
    const monthMap = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
    const m = monthMap[month];
    const y = parseInt(year);

    const lastDateObj = new Date(Date.UTC(y, m, 0));
    const totalDays = lastDateObj.getUTCDate();
    const formattedMY = `${totalDays} ${month} ${year}`;

    let sundays = 0;
    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(Date.UTC(y, m - 1, d));
        if (date.getUTCDay() === 0) sundays++;
    }
    const workingDays = totalDays - sundays;

    const rows = data.map((r) => ({
        p: r.Plant,
        cc: r.Customer,
        cn: r['Customer Name'],
        mc: r.Material,
        md: r['Material Description'],
        pl: r.Plan,
        my: formattedMY,
        wd: workingDays
    }));

    if (rows.length > 0 && rows[0].p === '' && rows[0].cc === '') {
        console.log('WARNING: First row mapped to mostly empty values. Check Excel headers!');
    }

    console.log(`Processing ${rows.length} rows for ${formattedMY}. Working Days: ${workingDays}`);

    return new Promise((resolve, reject) => {
        const connection = new Connection(config);
        connection.on('connect', (err) => {
            if (err) {
                console.error('Connection failed:', err);
                connection.close();
                return reject(err);
            }

            const delReq = new Request(
                `DELETE FROM [Sangkaj].[dbo].[Monthly Plan] WHERE [MonthYear] = @my`,
                (err, deleteCount) => {
                    if (err) {
                        console.error('Delete failed:', err);
                        connection.close();
                        return reject(err);
                    }

                    console.log(`Deleted ${deleteCount} old records. Starting batch insert...`);

                    let inserted = 0;
                    const batchSize = 100;

                    const insertBatch = (startIdx) => {
                        if (startIdx >= rows.length) {
                            connection.close();
                            return resolve(inserted);
                        }

                        const endIdx = Math.min(startIdx + batchSize, rows.length);
                        const batch = rows.slice(startIdx, endIdx);
                        let insertCount = 0;

                        const insertNext = (idx) => {
                            if (idx >= batch.length) {
                                inserted += insertCount;
                                return insertBatch(endIdx);
                            }

                            const r = batch[idx];
                            const ins = new Request(
                                `INSERT INTO [Sangkaj].[dbo].[Monthly Plan] ([Plant Code],[Customer Code],[Customer Name],[Material Code],[Material Description],[Plan],[MonthYear],[Working Days]) VALUES (@p,@cc,@cn,@mc,@md,@pl,@my,@wd)`,
                                (err) => {
                                    if (!err) insertCount++;
                                    insertNext(idx + 1);
                                }
                            );
                            ins.addParameter('p', TYPES.NVarChar, r.p);
                            ins.addParameter('cc', TYPES.NVarChar, r.cc);
                            ins.addParameter('cn', TYPES.NVarChar, r.cn);
                            ins.addParameter('mc', TYPES.NVarChar, r.mc);
                            ins.addParameter('md', TYPES.NVarChar, r.md);
                            ins.addParameter('pl', TYPES.Float, r.pl);
                            ins.addParameter('my', TYPES.NVarChar, r.my);
                            ins.addParameter('wd', TYPES.Float, r.wd);
                            connection.execSql(ins);
                        };
                        insertNext(0);
                    };
                    insertBatch(0);
                }
            );
            delReq.addParameter('my', TYPES.NVarChar, formattedMY);
            connection.execSql(delReq);
        });
        connection.on('error', (err) => { connection.close(); });
        connection.connect();
    });
};

const updateSingleRowInSql = (u) => {
    const parts = u.monthYear.split('-');
    const mStr = parts[0];
    const yStr = parts[1];
    const monthMap = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
    const lastDay = new Date(Date.UTC(parseInt(yStr), monthMap[mStr], 0));
    const dbMY = `${lastDay.getUTCDate()} ${mStr} ${yStr}`;

    return execQuery(
        `UPDATE [Sangkaj].[dbo].[Monthly Plan] SET [Plan] = @plan 
         WHERE [MonthYear] = @my 
         AND [Plant Code] = @plant AND [Material Code] = @mat AND [Customer Code] = @cust`,
        [
            { name: 'plan', type: TYPES.Float, value: parseFloat(u.quantity) || 0 },
            { name: 'my', type: TYPES.NVarChar, value: dbMY },
            { name: 'plant', type: TYPES.NVarChar, value: u.plant },
            { name: 'mat', type: TYPES.NVarChar, value: u.material_code },
            { name: 'cust', type: TYPES.NVarChar, value: u.customer_code || '' }
        ]
    );
};

const insertSingleRowInSql = async (row) => {
    const monthMap = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
    const m = monthMap[row.month];
    const y = parseInt(row.year);
    const lastDateObj = new Date(Date.UTC(y, m, 0));
    const totalDays = lastDateObj.getUTCDate();
    const dbMY = `${totalDays} ${row.month} ${row.year}`;

    let sundays = 0;
    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(Date.UTC(y, m - 1, d));
        if (date.getUTCDay() === 0) sundays++;
    }
    const workingDays = totalDays - sundays;

    return execQuery(
        `INSERT INTO [Sangkaj].[dbo].[Monthly Plan] 
         ([Plant Code],[Customer Code],[Customer Name],[Material Code],[Material Description],[Plan],[MonthYear],[Working Days]) 
         VALUES (@p,@cc,@cn,@mc,@md,@pl,@my,@wd)`,
        [
            { name: 'p', type: TYPES.NVarChar, value: row.plant },
            { name: 'cc', type: TYPES.NVarChar, value: row.customer_code },
            { name: 'cn', type: TYPES.NVarChar, value: row.customer_name },
            { name: 'mc', type: TYPES.NVarChar, value: row.material_code },
            { name: 'md', type: TYPES.NVarChar, value: row.material_name },
            { name: 'pl', type: TYPES.Float, value: parseFloat(row.quantity) || 0 },
            { name: 'my', type: TYPES.NVarChar, value: dbMY },
            { name: 'wd', type: TYPES.Float, value: workingDays }
        ]
    );
};

const fetchTotalStats = () => execQuery(`SELECT [MonthYear], COUNT(*) as count FROM [Sangkaj].[dbo].[Monthly Plan] GROUP BY [MonthYear]`);

const verifyUserLogin = async (email, rawPassword) => {
    const bcrypt = require('bcryptjs');
    const rows = await execQuery(
        `SELECT [password] FROM [Sangkaj].[dbo].[login_details] WHERE [emailid] = @email`,
        [{ name: 'email', type: TYPES.NVarChar, value: email }]
    );

    if (rows.length === 0) return null;

    const hashedPassword = rows[0].password;
    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);

    return isMatch ? { email } : null;
};

module.exports = { getDemandFromSql, replaceDemandInSql, updateSingleRowInSql, fetchTotalStats, insertSingleRowInSql, verifyUserLogin };
