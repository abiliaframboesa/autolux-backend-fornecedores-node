const pool = require('./database');

async function testarLigacao() {
    try {
        const [resultado] = await pool.query('SELECT 1 AS teste');

        console.log('Ligação à base de dados estabelecida!');
        console.log('Resultado do teste:', resultado[0].teste);
    } catch (erro) {
        console.error('Erro na ligação à base de dados:', erro.message);
    } finally {
        await pool.end();
    }
}

testarLigacao();