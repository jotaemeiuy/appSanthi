// app.js
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const db = require('./db');
const path = require('path');
const fs = require('fs');


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('Service Worker registrado con éxito: ', registration.scope);
        }, error => {
            console.log('Error al registrar el Service Worker: ', error);
        });
    });
}


const app = express();

// Configura Pug como motor de plantillas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Para servir archivos estáticos

// Ruta para mostrar el formulario
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta para guardar datos
app.post('/add', (req, res) => {
    const { date, description } = req.body;
    db.run(`INSERT INTO entries (date, description) VALUES (?, ?)`, [date, description], (err) => {
        if (err) {
            return res.status(500).send("Error al guardar los datos");
        }
        res.redirect('/view?page=1');
    });
});

// Ruta para mostrar datos paginados
app.get('/view', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    db.all(`SELECT * FROM entries ORDER BY date LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        if (err) {
            return res.status(500).send("Error al obtener los datos");
        }
        res.render('view', { rows, page });
    });
});

// Ruta para eliminar datos
app.post('/delete/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM entries WHERE id = ?`, [id], (err) => {
        if (err) {
            return res.status(500).send("Error al eliminar el dato");
        }
        res.redirect('/view?page=1');
    });
});

// Ruta para editar datos (muestra formulario de edición)
app.get('/edit/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM entries WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).send("Error al obtener el dato");
        }
        res.render('edit', { entry: row });
    });
});

// Ruta para actualizar datos
app.post('/edit/:id', (req, res) => {
    const { id } = req.params;
    const { date, description } = req.body;
    db.run(`UPDATE entries SET date = ?, description = ? WHERE id = ?`, [date, description, id], (err) => {
        if (err) {
            return res.status(500).send("Error al actualizar el dato");
        }
        res.redirect('/view?page=1');
    });
});

// Ruta para generar PDF
app.get('/generate-pdf', (req, res) => {
    const doc = new PDFDocument();
    let filename = `report-${Date.now()}.pdf`;
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    db.all(`SELECT * FROM entries ORDER BY date`, (err, rows) => {
        if (err) {
            return res.status(500).send("Error al obtener los datos");
        }

        rows.forEach((row) => {
            doc.text(`Date: ${row.date}`, { continued: true }).text(`Description: ${row.description}`);
            doc.moveDown();
        });

        doc.end();
    });
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
