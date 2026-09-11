const express = require('express');
const setupDatabase = require('./database');

const app = express();
app.use(express.json());

// Permite usar a porta dinâmica do Render ou a 3000 localmente
const PORT = process.env.PORT || 3000;

let db;
setupDatabase().then(database => {
    if (!database) {
        console.log("Falha ao carregar o banco de dados.");
        return;
    }
    db = database;
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}).catch(err => {
    console.error("Erro na inicialização:", err);
});

// ==========================================
// 1. CONTROLADOR DE PRODUTO (CRUD)
// ==========================================

app.post('/produtos', async (req, res) => {
    const { nome, descricao, preco, codigo_barras } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO produtos (nome, descricao, preco, codigo_barras) VALUES (?, ?, ?, ?)',
            [nome, descricao, preco, codigo_barras]
        );
        res.status(201).json({ id: result.lastID, nome, descricao, preco, codigo_barras });
    } catch (error) {
        res.status(400).json({ error: "Erro ao criar produto. Verifique se o código de barras é único." });
    }
});

app.get('/produtos', async (req, res) => {
    const produtos = await db.all('SELECT * FROM produtos');
    res.json(produtos);
});

app.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, codigo_barras } = req.body;
    await db.run(
        'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, codigo_barras = ? WHERE id = ?',
        [nome, descricao, preco, codigo_barras, id]
    );
    res.json({ message: "Produto atualizado com sucesso!" });
});

app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM produtos WHERE id = ?', [id]);
    res.json({ message: "Produto removido com sucesso!" });
});

// ==========================================
// 2. CONTROLADOR DE FORNECEDOR (CRUD)
// ==========================================

app.post('/fornecedores', async (req, res) => {
    const { nome, cnpj, endereco, contato } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO fornecedores (nome, cnpj, endereco, contato) VALUES (?, ?, ?, ?)',
            [nome, cnpj, endereco, contato]
        );
        res.status(201).json({ id: result.lastID, nome, cnpj, endereco, contato });
    } catch (error) {
        res.status(400).json({ error: "Erro ao criar fornecedor. Verifique se o CNPJ é único." });
    }
});

app.get('/fornecedores', async (req, res) => {
    const fornecedores = await db.all('SELECT * FROM fornecedores');
    res.json(fornecedores);
});

app.put('/fornecedores/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cnpj, endereco, contato } = req.body;
    await db.run(
        'UPDATE fornecedores SET nome = ?, cnpj = ?, endereco = ?, contato = ? WHERE id = ?',
        [nome, cnpj, endereco, contato, id]
    );
    res.json({ message: "Fornecedor atualizado com sucesso!" });
});

app.delete('/fornecedores/:id', async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM fornecedores WHERE id = ?', [id]);
    res.json({ message: "Fornecedor removido com sucesso!" });
});

// ==========================================
// 3. CONTROLADOR DE ASSOCIAÇÃO (Muitos-para-Muitos)
// ==========================================

app.post('/associar', async (req, res) => {
    const { produto_id, fornecedor_id } = req.body;
    try {
        await db.run(
            'INSERT INTO produto_fornecedor (produto_id, fornecedor_id) VALUES (?, ?)',
            [produto_id, fornecedor_id]
        );
        res.status(201).json({ message: "Associação criada com sucesso!" });
    } catch (error) {
        res.status(400).json({ error: "Erro ao criar associação. Verifique se os IDs existem." });
    }
});

app.delete('/desassociar', async (req, res) => {
    const { produto_id, fornecedor_id } = req.body;
    await db.run(
        'DELETE FROM produto_fornecedor WHERE produto_id = ? AND fornecedor_id = ?',
        [produto_id, fornecedor_id]
    );
    res.json({ message: "Associação removida com sucesso!" });
});

app.get('/produtos/:id/fornecedores', async (req, res) => {
    const { id } = req.params;
    const fornecedores = await db.all(`
        SELECT f.* FROM fornecedores f
        JOIN produto_fornecedor pf ON f.id = pf.fornecedor_id
        WHERE pf.produto_id = ?
    `, [id]);
    res.json(fornecedores);
});

app.get('/fornecedores/:id/produtos', async (req, res) => {
    const { id } = req.params;
    const produtos = await db.all(`
        SELECT p.* FROM produtos p
        JOIN produto_fornecedor pf ON p.id = pf.produto_id
        WHERE pf.fornecedor_id = ?
    `, [id]);
    res.json(produtos);
});// Endpoint 1: Listar produtos com estoque abaixo do limite mínimo
app.get('/produtos/estoque-baixo', async (req, res) => {
  try {
    const produtos = await db.all(
      `SELECT * FROM produtos WHERE quantidade < estoque_minimo`
    );
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos com estoque baixo' });
  }
});

// Endpoint 2: Comparar preços de fornecedores para um determinado produto
app.get('/fornecedores/cotacao/:produto_id', async (req, res) => {
  const { produto_id } = req.params;
  try {
    const cotacoes = await db.all(
      `SELECT f.id AS fornecedor_id, f.nome AS nome_fornecedor, pf.preco 
       FROM produto_fornecedor pf
       JOIN fornecedores f ON f.id = pf.fornecedor_id
       WHERE pf.produto_id = ?
       ORDER BY pf.preco ASC`,
      [produto_id]
    );
    res.json(cotacoes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cotação de fornecedores' });
  }
});