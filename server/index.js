require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const { getDemandFromSql, replaceDemandInSql, updateSingleRowInSql, fetchTotalStats, insertSingleRowInSql, verifyUserLogin } = require('./sqlService');

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS to allow specific origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://sangkaj_dashboard.aradhya.gs'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body; // username is the email

    try {
        const user = await verifyUserLogin(username, password);
        if (user) {
            res.json({ success: true, user: { username: user.email } });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication service temporarily unavailable' });
    }
});

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => res.send(`Backend is running on ${port}`));

app.get('/api/template', (req, res) => {
    const templateData = [
        {
            Plant: '1000',
            Customer: 'C001',
            'Customer Name': 'Example Customer',
            Material: 'M001',
            'Material Description': 'Example Material',
            Plan: 100
        }
    ];
    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        // Strict extension check
        if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
            return res.status(400).json({ error: 'Wrong File' });
        }

        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ error: 'Month and Year are required' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length === 0) {
            return res.status(400).json({ error: 'The uploaded file has no sheets.' });
        }

        let targetSheet = null;
        let sheetName = '';
        if (sheetNames.length === 1) {
            // If only one sheet, use it regardless of name
            sheetName = sheetNames[0];
        } else {
            // If multiple sheets, look for "Target"
            const targetSheet = sheetNames.find(s => s.trim().toLowerCase() === 'target');
            if (targetSheet) {
                sheetName = targetSheet;
            } else {
                return res.status(400).json({
                    error: `File contains multiple sheets (${sheetNames.join(', ')}), but none are named "Target". Please rename the relevant sheet to "Target".`
                });
            }
        }

        console.log(`Processing sheet: "${sheetName}"`);
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
            return res.status(400).json({ error: 'Could not read sheet data.' });
        }

        const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        if (!rawRows || rawRows.length === 0) {
            return res.status(400).json({ error: 'Selected sheet is empty' });
        }

        // 2. Identify Column Indices (Flexible with Extras)
        // required: Plant, Customer, Customer Name, Material, Material Description, Plan
        const REQUIRED_HEADERS = ['plant', 'customer', 'customer name', 'material', 'material description', 'plan'];

        let headerRowIndex = -1;
        let idx = null;

        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
            const row = rawRows[i];
            const headerLower = row.map(h => String(h).toLowerCase().trim());

            // Check if ALL required headers are present in this row
            // We do NOT filter for exact match of length anymore, allowing extras
            const allFound = REQUIRED_HEADERS.every(h => headerLower.includes(h));

            if (allFound) {
                headerRowIndex = i;
                // Map indices for found headers
                idx = {
                    plant: headerLower.indexOf('plant'),
                    customer: headerLower.indexOf('customer'),
                    customerName: headerLower.indexOf('customer name'),
                    material: headerLower.indexOf('material'),
                    description: headerLower.indexOf('material description'),
                    plan: headerLower.indexOf('plan')
                };
                break;
            }
        }

        if (headerRowIndex === -1 || !idx) {
            return res.status(400).json({ error: 'Invalid Excel Format. Missing required columns: Plant, Customer, Customer Name, Material, Material Description, Plan' });
        }

        const ALLOWED_PLANTS = ['1111', '1121', '1211', '1212', '1213', '1311', '1411', '1511'];

        // Calculate Month Metadata (Last Date and Working Days)
        const monthMap = { 'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11 };
        const monthLongNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mIdx = monthMap[month.toLowerCase().substring(0, 3)];
        const yVal = parseInt(year, 10);

        // Last Day of month
        const lastDayDate = new Date(yVal, mIdx + 1, 0);
        const dayCount = lastDayDate.getDate();
        const formattedLastDate = `${dayCount} ${monthLongNames[mIdx]} ${yVal}`;

        // Count Sundays
        let sundays = 0;
        for (let d = 1; d <= dayCount; d++) {
            const date = new Date(yVal, mIdx, d);
            if (date.getDay() === 0) sundays++;
        }
        const workingDaysCount = dayCount - sundays;

        const validDataRows = [];
        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            const plantVal = String(row[idx.plant] || '').trim();
            const custVal = String(row[idx.customer] || '').trim();
            const matVal = String(row[idx.material] || '').trim();
            const planRaw = row[idx.plan];

            if (!plantVal && !custVal && !matVal && !planRaw) continue;

            let quantity = 0;
            if (typeof planRaw === 'number') {
                quantity = planRaw;
            } else if (typeof planRaw === 'string') {
                const cleaned = planRaw.replace(/,/g, '');
                quantity = parseFloat(cleaned) || 0;
            }

            if (quantity === 0) continue;

            const parseNumericString = (val) => {
                if (!val) return '';
                if (/^\d+$/.test(val)) {
                    return String(parseInt(val, 10));
                }
                return val;
            };

            const finalPlant = parseNumericString(plantVal);
            const finalCust = parseNumericString(custVal);
            const finalMat = parseNumericString(matVal);

            if (!finalPlant || !finalCust || !finalMat) {
                return res.status(400).json({ error: 'Upload failed due to blanks in mandatory columns' });
            }

            if (!ALLOWED_PLANTS.includes(finalPlant)) {
                return res.status(400).json({ error: `Invalid Plant: ${finalPlant}. Allowed: ${ALLOWED_PLANTS.join(', ')}` });
            }

            validDataRows.push({
                Plant: finalPlant,
                Customer: finalCust,
                'Customer Name': String(row[idx.customerName] || '').trim(),
                Material: finalMat,
                'Material Description': String(row[idx.description] || '').trim(),
                Plan: quantity,
                'Working Days': workingDaysCount,
                MonthYear: formattedLastDate
            });
        }

        if (validDataRows.length === 0) {
            return res.status(400).json({ error: 'No valid data rows found. Please ensure that columns like Plant, Customer, Material, and Plan are not blank in your file.' });
        }

        const count = await replaceDemandInSql(month, year, validDataRows);
        res.json({ message: `Success! ${count} records have been uploaded and tagged as ${month}-${year}.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
});

app.get('/api/demand', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ error: 'Month/Year required' });
        const data = await getDemandFromSql(month, year);
        const mapped = data.map((r, i) => ({
            id: i,
            plant: r['Plant Code'] || '',
            customer_code: r['Customer Code'] || '',
            customer_name: r['Customer Name'] || '',
            material_code: r['Material Code'] || '',
            material_name: r['Material Description'] || '',
            quantity: r['Plan'] || 0
        }));
        res.json(mapped);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

app.post('/api/demand', async (req, res) => {
    try {
        await insertSingleRowInSql(req.body);
        res.json({ message: 'Record inserted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to insert record' });
    }
});

app.patch('/api/demand/:id', async (req, res) => {
    try {
        await updateSingleRowInSql(req.body);
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

app.post('/api/sync-sql', (req, res) => res.json({ message: 'Direct SQL linked' }));

app.get('/api/stats', async (req, res) => {
    try {
        console.log('Fetching stats...');
        const stats = await fetchTotalStats();
        console.log('Stats fetched:', stats ? stats.length : 0, 'breakdowns');

        if (!stats || stats.length === 0) {
            return res.json({ total: 0, breakdowns: [] });
        }

        const breakdowns = stats.map(s => {
            // s.MonthYear could be "31 Jan 2026" or "30 Jun 2025" format
            const parts = (s.MonthYear || '').toString().split(' ');
            return {
                month: parts[1] || 'Unknown',
                year: parts[2] || 'Unknown',
                count: parseInt(s.count) || 0
            };
        });

        const total = breakdowns.reduce((a, b) => a + (b.count || 0), 0);
        res.json({ total, breakdowns });
    } catch (err) {
        console.error('Stats error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ error: err.message || 'Failed to fetch stats' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
