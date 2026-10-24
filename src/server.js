const express = require('express');
const pool = require('./database');

const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rota inicial para confirmar que a API funciona
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API AutoLux a funcionar!',
        estado: 'OK'
    });
});

//fase 1 - Trabalhar com fornecedores
// Listar todos os fornecedores
app.get('/fornecedores', async (req, res) => {
    try {
        const [fornecedores] = await pool.query(
            'SELECT * FROM fornecedores'
        );

        res.json(fornecedores);
    } catch (erro) {
        console.error('Erro ao consultar fornecedores:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar os fornecedores.'
        });
    }
});

//fase 2 - Trabalhar com encomendas
// Listar todas as encomendas a fornecedores
app.get('/encomendas', async (req, res) => {
    try {
        const [encomendas] = await pool.query(`
            SELECT
                e.id,
                e.fornecedor_id,
                f.nome AS nome_fornecedor,
                e.data_encomenda,
                e.estado,
                e.total
            FROM encomendas_fornecedor e
            INNER JOIN fornecedores f
                ON e.fornecedor_id = f.id
            ORDER BY e.data_encomenda DESC
        `);

        res.json(encomendas);
    } catch (erro) {
        console.error('Erro ao consultar encomendas:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar as encomendas.'
        });
    }
});

//fase 2

// Consultar uma encomenda pelo ID, incluindo as respetivas peças
app.get('/encomendas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        const [encomendas] = await pool.query(
            `SELECT
                e.id,
                e.fornecedor_id,
                f.nome AS nome_fornecedor,
                e.data_encomenda,
                e.estado,
                e.total
             FROM encomendas_fornecedor e
             INNER JOIN fornecedores f
                ON e.fornecedor_id = f.id
             WHERE e.id = ?`,
            [id]
        );

        if (encomendas.length === 0) {
            return res.status(404).json({
                erro: 'Encomenda não encontrada.'
            });
        }

        const [pecas] = await pool.query(
            `SELECT
                id,
                referencia_peca,
                nome_peca,
                quantidade,
                preco_unitario
             FROM encomenda_pecas
             WHERE encomenda_id = ?`,
            [id]
        );

        res.json({
            ...encomendas[0],
            pecas
        });
    } catch (erro) {
        console.error('Erro ao consultar encomenda:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar a encomenda.'
        });
    }
});


//fase 2
// Criar uma nova encomenda a fornecedor
app.post('/encomendas', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { fornecedor_id, pecas } = req.body;

        // Validar fornecedor_id
        if (!Number.isInteger(fornecedor_id) || fornecedor_id <= 0) {
            return res.status(400).json({
                erro: 'O fornecedor_id deve ser um número inteiro positivo.'
            });
        }

        // Validar lista de peças
        if (!Array.isArray(pecas) || pecas.length === 0) {
            return res.status(400).json({
                erro: 'A encomenda deve conter pelo menos uma peça.'
            });
        }

        // Validar cada peça
        for (const peca of pecas) {
            if (
                typeof peca.referencia_peca !== 'string' ||
                peca.referencia_peca.trim() === '' ||
                typeof peca.nome_peca !== 'string' ||
                peca.nome_peca.trim() === '' ||
                !Number.isInteger(peca.quantidade) ||
                peca.quantidade <= 0 ||
                typeof peca.preco_unitario !== 'number' ||
                peca.preco_unitario < 0
            ) {
                return res.status(400).json({
                    erro: 'Os dados de cada peça são inválidos.'
                });
            }
        }

        // Confirmar que o fornecedor existe
        const [fornecedores] = await connection.query(
            'SELECT id, nome FROM fornecedores WHERE id = ? AND ativo = 1',
            [fornecedor_id]
        );

        if (fornecedores.length === 0) {
            return res.status(404).json({
                erro: 'Fornecedor não encontrado ou está inativo.'
            });
        }

        // Calcular o total da encomenda
        const total = pecas.reduce(
            (soma, peca) =>
                soma + (peca.quantidade * peca.preco_unitario),
            0
        );

        // Iniciar transação
        await connection.beginTransaction();

        // Criar a encomenda
        const [resultadoEncomenda] = await connection.query(
            `INSERT INTO encomendas_fornecedor
                (fornecedor_id, estado, total)
             VALUES (?, 'Pendente', ?)`,
            [fornecedor_id, total]
        );

        const encomendaId = resultadoEncomenda.insertId;

        // Inserir as peças da encomenda
        for (const peca of pecas) {
            await connection.query(
                `INSERT INTO encomenda_pecas
                    (encomenda_id, referencia_peca, nome_peca, quantidade, preco_unitario)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    encomendaId,
                    peca.referencia_peca.trim(),
                    peca.nome_peca.trim(),
                    peca.quantidade,
                    peca.preco_unitario
                ]
            );
        }

        // Confirmar todas as alterações
        await connection.commit();

        res.status(201).json({
            mensagem: 'Encomenda criada com sucesso!',
            id: encomendaId,
            fornecedor_id,
            nome_fornecedor: fornecedores[0].nome,
            estado: 'Pendente',
            total: total.toFixed(2),
            pecas
        });

    } catch (erro) {
        await connection.rollback();

        console.error('Erro ao criar encomenda:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível criar a encomenda.'
        });
    } finally {
        connection.release();
    }
});


//fase 2
// Atualizar o estado de uma encomenda //
app.put('/encomendas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;

        // Validar o ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        // Validar o estado
        const estadosPermitidos = [
            'Pendente',
            'Enviada',
            'Recebida'
        ];

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                erro: 'Estado inválido. Utiliza Pendente, Enviada ou Recebida.'
            });
        }

        // Confirmar que a encomenda existe
        const [encomendas] = await pool.query(
            'SELECT id FROM encomendas_fornecedor WHERE id = ?',
            [id]
        );

        if (encomendas.length === 0) {
            return res.status(404).json({
                erro: 'Encomenda não encontrada.'
            });
        }

        // Atualizar o estado
        await pool.query(
            'UPDATE encomendas_fornecedor SET estado = ? WHERE id = ?',
            [estado, id]
        );

        res.json({
            mensagem: 'Estado da encomenda atualizado com sucesso!',
            id,
            estado
        });

    } catch (erro) {
        console.error('Erro ao atualizar encomenda:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível atualizar a encomenda.'
        });
    }
});


//fase 1
// Consultar um fornecedor pelo ID
app.get('/fornecedores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        const [fornecedores] = await pool.query(
            'SELECT * FROM fornecedores WHERE id = ?',
            [id]
        );

        if (fornecedores.length === 0) {
            return res.status(404).json({
                erro: 'Fornecedor não encontrado.'
            });
        }

        res.json(fornecedores[0]);
    } catch (erro) {
        console.error('Erro ao consultar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar o fornecedor.'
        });
    }
});

// fase 1
// Registar um novo fornecedor
app.post('/fornecedores', async (req, res) => {
    try {
        const { nome, email, telefone } = req.body;

        if (
            typeof nome !== 'string' || !nome.trim() ||
            typeof email !== 'string' || !email.trim() ||
            typeof telefone !== 'string' || !telefone.trim()
        ) {
            return res.status(400).json({
                erro: 'Nome, email e telefone são obrigatórios.'
            });
        }

        const [resultado] = await pool.query(
            'INSERT INTO fornecedores (nome, email, telefone, ativo) VALUES (?, ?, ?, ?)',
            [nome.trim(), email.trim(), telefone.trim(), 1]
        );

        res.status(201).json({
            mensagem: 'Fornecedor criado com sucesso!',
            id: resultado.insertId,
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
            ativo: 1
        });
    } catch (erro) {
        console.error('Erro ao criar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível criar o fornecedor.'
        });
    }
});

// fase 1
// Atualizar um fornecedor
app.put('/fornecedores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, email, telefone } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        if (
            typeof nome !== 'string' || !nome.trim() ||
            typeof email !== 'string' || !email.trim() ||
            typeof telefone !== 'string' || !telefone.trim()
        ) {
            return res.status(400).json({
                erro: 'Nome, email e telefone são obrigatórios.'
            });
        }

        const [resultado] = await pool.query(
            `UPDATE fornecedores
             SET nome = ?, email = ?, telefone = ?
             WHERE id = ?`,
            [nome.trim(), email.trim(), telefone.trim(), id]
        );

        if (resultado.affectedRows === 0) {
            const [fornecedores] = await pool.query(
                'SELECT id FROM fornecedores WHERE id = ?',
                [id]
            );

            if (fornecedores.length === 0) {
                return res.status(404).json({
                    erro: 'Fornecedor não encontrado.'
                });
            }
        }

        res.json({
            mensagem: 'Fornecedor atualizado com sucesso!',
            id,
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim()
        });
    } catch (erro) {
        console.error('Erro ao atualizar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível atualizar o fornecedor.'
        });
    }
});

// fase 1
// Desativar um fornecedor
app.patch('/fornecedores/:id/desativar', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        const [resultado] = await pool.query(
            'UPDATE fornecedores SET ativo = 0 WHERE id = ? AND ativo = 1',
            [id]
        );

        if (resultado.affectedRows === 0) {
            const [fornecedores] = await pool.query(
                'SELECT id, ativo FROM fornecedores WHERE id = ?',
                [id]
            );

            if (fornecedores.length === 0) {
                return res.status(404).json({
                    erro: 'Fornecedor não encontrado.'
                });
            }

            return res.status(409).json({
                erro: 'O fornecedor já está desativado.'
            });
        }

        res.json({
            mensagem: 'Fornecedor desativado com sucesso!',
            id,
            ativo: 0
        });
    } catch (erro) {
        console.error('Erro ao desativar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível desativar o fornecedor.'
        });
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`API AutoLux disponível em http://localhost:${PORT}`);
});