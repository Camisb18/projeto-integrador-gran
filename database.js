const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDatabase() {
    try {
        const db = await open({
            filename: './database.sqlite',
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                descricao TEXT,
                preco REAL NOT NULL,
                codigo_barras TEXT UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS fornecedores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cnpj TEXT UNIQUE NOT NULL,
                endereco TEXT,
                contato TEXT
            );

            CREATE TABLE IF NOT EXISTS produto_fornecedor (
                produto_id INTEGER,
                fornecedor_id INTEGER,
                PRIMARY KEY (produto_id, fornecedor_id),
                FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE,
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores (id) ON DELETE CASCADE
            );
        `);

        console.log("Banco de dados e tabelas configurados com sucesso!");
        return db;
    } catch (err) {
        console.error("Erro ao inicializar o banco de dados:", err);
    }
}

module.exports = setupDatabase;