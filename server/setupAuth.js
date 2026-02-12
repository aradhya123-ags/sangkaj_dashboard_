const { Connection, Request, TYPES } = require('tedious');

const config = {
    server: '103.108.117.81',
    authentication: { type: 'default', options: { userName: 'sangkaj', password: 'sangkaj7' } },
    options: {
        port: 1433,
        database: 'Sangkaj',
        trustServerCertificate: true
    }
};

const setupLogin = () => {
    const conn = new Connection(config);

    conn.on('connect', (err) => {
        if (err) {
            console.error('Connection failed:', err);
            return;
        }
        console.log('Connected');

        const createTableSql = `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users') 
            BEGIN 
                CREATE TABLE Users (
                    Id INT IDENTITY(1,1) PRIMARY KEY, 
                    Username NVARCHAR(255) UNIQUE, 
                    Password NVARCHAR(255)
                ) 
            END
        `;

        const req = new Request(createTableSql, (err) => {
            if (err) {
                console.error('Table create error:', err.message);
                // If permission error, maybe table already exists or we just can't check
            } else {
                console.log('Users table ready');
            }

            // Insert default user
            const insertUserSql = `
                IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'manoj.gulhane@sangkaj.com')
                BEGIN
                    INSERT INTO Users (Username, Password) VALUES ('manoj.gulhane@sangkaj.com', 'Sangkaj@2026')
                END
            `;
            const insReq = new Request(insertUserSql, (err) => {
                if (err) console.error('Insert user error:', err.message);
                else console.log('User manoj.gulhane@sangkaj.com ready with password Sangkaj@2026');
                conn.close();
            });
            conn.execSql(insReq);
        });

        conn.execSql(req);
    });

    conn.connect();
};

setupLogin();
