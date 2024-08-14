const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_FILE = 'patients.json';

app.use(bodyParser.json());
app.use(express.static('public')); // Serve your HTML, CSS, and JS files

// Read patient queue from file
app.get('/patients', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Could not read data file' });
        }
        const patients = JSON.parse(data || '[]');
        res.json(patients);
    });
});

// Write patient queue to file
app.post('/patients', (req, res) => {
    const patients = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(patients), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not write data file' });
        }
        res.status(200).json({ message: 'Data saved' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
