const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const expressLayouts = require("express-ejs-layouts");

// fetch compatible con CommonJS en Node 24
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


const app = express();
const port = 3000;

// CONFIG SQL SERVER
const dbConfig = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'CrudApiDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// MIDDLEWARES 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

const studentName = "Nicole Ojeda";

app.get("/", async (req, res) => {
    const pool = await sql.connect(dbConfig);
    const q = req.query.q || "";

    const result = await pool.request()
        .input("q", sql.NVarChar, `%${q}%`)
        .query(`
            SELECT * FROM Items
            WHERE Title LIKE @q OR Body LIKE @q
            ORDER BY Id DESC
        `);

    res.render("index", { items: result.recordset, q, studentName });
});

// FORMULARIO CREAR
app.get("/create", (req, res) => {
    res.render("create", { studentName });
});

app.post("/create", async (req, res) => {
    const { title, body } = req.body;

    const pool = await sql.connect(dbConfig);

    await pool.request()
        .input("title", sql.NVarChar, title)
        .input("body", sql.NVarChar, body)
        .input("source", sql.NVarChar, "Local")
        .query(`
            INSERT INTO Items (Title, Body, Source)
            VALUES (@title, @body, @source)
        `);

    res.redirect("/");
});

// EDITAR
app.get("/edit/:id", async (req, res) => {
    const pool = await sql.connect(dbConfig);

    const item = await pool.request()
        .input("id", sql.Int, req.params.id)
        .query("SELECT * FROM Items WHERE Id = @id");

    res.render("edit", { item: item.recordset[0], studentName });
});

app.post("/edit/:id", async (req, res) => {
    const pool = await sql.connect(dbConfig);

    await pool.request()
        .input("id", sql.Int, req.params.id)
        .input("title", sql.NVarChar, req.body.title)
        .input("body", sql.NVarChar, req.body.body)
        .query(`
            UPDATE Items
            SET Title = @title, Body = @body
            WHERE Id = @id
        `);

    res.redirect("/");
});

// ELIMINAR 
app.get("/delete/:id", async (req, res) => {
    const pool = await sql.connect(dbConfig);

    await pool.request()
        .input("id", sql.Int, req.params.id)
        .query("DELETE FROM Items WHERE Id = @id");

    res.redirect("/");
});

// API EXTERNA 
app.get("/api/users", async (req, res) => {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    const users = await response.json();

    res.render("api", { users, studentName });
});

// SERVIDOR
app.listen(port, () => {
    console.log(`Servidor activo en http://localhost:${port}`);
});
