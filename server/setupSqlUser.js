const { Connection, Request, TYPES } = require('tedious');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
    server: process.env.DB_HOST || '103.108.117.81',
    authentication: { type: 'default', options: { userName: process.env.DB_USER || 'sangkaj', password: process.env.DB_PASSWORD || 'sangkaj7' } },
    options: {
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_NAME || 'Sangkaj',
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true
    }
};

const setupUser = async () => {
    const email = 'manoj.gulhane@sangkaj.com';
    const rawPassword = 'Sangkaj@2026';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const conn = new Connection(config);

    conn.on('connect', (err) => {
        if (err) {
            console.error('Connection failed:', err);
            return;
        }
        console.log('Connected to SQL Server');

        // Check if user exists, if not insert
        const checkSql = "SELECT * FROM [Sangkaj].[dbo].[login_details] WHERE [emailid] = @email";
        const checkReq = new Request(checkSql, (err, rowCount) => {
            if (err) {
                console.error('Check failed:', err);
                conn.close();
                return;
            }

            if (rowCount > 0) {
                console.log('User already exists. Updating password...');
                const updateSql = "UPDATE [Sangkaj].[dbo].[login_details] SET [password] = @pwd WHERE [emailid] = @email";
                const upReq = new Request(updateSql, (err) => {
                    if (err) console.error('Update failed:', err);
                    else console.log('Password updated successfully');
                    conn.close();
                });
                upReq.addParameter('email', TYPES.NVarChar, email);
                upReq.addParameter('pwd', TYPES.NVarChar, hashedPassword);
                conn.execSql(upReq);
            } else {
                console.log('User does not exist. Inserting...');
                const insertSql = "INSERT INTO [Sangkaj].[dbo].[login_details] ([emailid], [password]) VALUES (@email, @pwd)";
                const insReq = new Request(insertSql, (err) => {
                    if (err) console.error('Insert failed:', err);
                    else console.log('User inserted successfully');
                    conn.close();
                });
                insReq.addParameter('email', TYPES.NVarChar, email);
                insReq.addParameter('pwd', TYPES.NVarChar, hashedPassword);
                conn.execSql(insReq);
            }
        });

        checkReq.addParameter('email', TYPES.NVarChar, email);
        conn.execSql(checkReq);
    });

    conn.connect();
};

setupUser();
