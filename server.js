const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 1306;

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server started on port 1306`);
});

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) return console.error('Error while trying to open or create database:', err.message);
    console.log('Connected with the Database');
});

db.run(`
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        data TEXT
    )
`);

app.get("/", (req,res)=>{
    res.send("This is a API service that I made to use in my websites or in my games.")
})

app.post('/save/:id', (req, res) => {
    const { id } = req.params;
    const jsonData = JSON.stringify(req.body);

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Corpo inválido. Envie dados JSON válidos.' });
    }

    db.run(
        `INSERT INTO posts (id, data) VALUES (?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
        [id, jsonData],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao salvar no banco.', details: err.message });
            }
            res.status(200).json({ message: `Dados salvos para o ID ${id}.`, saved: req.body });
        }
    );
});

app.get('/get/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT data FROM posts WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao consultar o banco.', details: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: `Nenhum dado encontrado para o ID ${id}.` });
        }

        try {
            const data = JSON.parse(row.data);
            res.status(200).json({ id, data });
        } catch (e) {
            res.status(500).json({ error: 'Erro ao interpretar os dados salvos.' });
        }
    });
});
