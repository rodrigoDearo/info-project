const mssql = require('mssql');

async function main() {
  console.log('Verificando se o banco de dados fleet_db existe...');

  const config = {
    user: 'sa',
    password: 'S3nh4_F0rt3_2026!',
    server: process.env.DB_HOST || 'localhost',
    database: 'master', // Conecta obrigatoriamente no banco master do sistema
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  try {
    const pool = await mssql.connect(config);
    
    const query = `
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'fleet_db')
      BEGIN
        CREATE DATABASE fleet_db;
      END
    `;
    
    await pool.request().query(query);
    await pool.close();
    
    console.log('Banco de dados fleet_db garantido com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao conectar ou criar o banco de dados:', error);
    process.exit(1);
  }
}

main();