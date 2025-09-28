// ===================================================
// GERADOR DE HASH DE SENHA (generate-hash.js)
// Use este script para criar um hash seguro para as suas senhas.
// ===================================================
const bcrypt = require('bcryptjs');

// Coloque a senha que deseja encriptar aqui
const plainPassword = '1234'; // Mude para a sua senha desejada

// O 'salt' é um fator de custo. 10 ou 12 é um bom valor.
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar o hash:', err);
    return;
  }
  
  console.log('Senha em texto plano:', plainPassword);
  console.log('\nHash gerado (guarde isto na sua base de dados):');
  console.log(hash);
});