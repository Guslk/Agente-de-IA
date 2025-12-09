// generateHash.js
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Defina a senha que você quer usar
const password = '1234'; 

const hash = bcrypt.hashSync(password, saltRounds);

console.log('Seu hash é:');
console.log(hash);