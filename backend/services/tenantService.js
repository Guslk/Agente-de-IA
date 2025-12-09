// ===================================================
// SERVIÇO DO INQUILINO (TENANT)
// Este ficheiro contém a lógica de negócio para
// interagir com a base de dados master (MongoDB).
// ===================================================
const Tenant = require('../models/tenant.model'); // Importa o modelo Mongoose para os inquilinos

/**
 * Encontra um inquilino ativo na base de dados pelo seu subdomínio.
 * @param {string} subdomain - O subdomínio a ser procurado (ex: "tecnotooling").
 * @returns {Promise<object|null>} Retorna o documento completo do inquilino se encontrado e ativo, caso contrário retorna null.
 */
const findTenantBySubdomain = async (subdomain) => {
  try {
    // Procura por um único documento na coleção 'tenants' que corresponda aos critérios.
    // Usamos toLowerCase() para garantir que a busca não diferencia maiúsculas de minúsculas (ex: "TecnoTooling" e "tecnotooling" são tratados como iguais).
    // Verificamos também se o status do inquilino é 'active' para garantir que apenas clientes ativos possam aceder.
    const tenant = await Tenant.findOne({ 
      subdomain: subdomain.toLowerCase(), 
      status: 'active' 
    });

    return tenant;
  } catch (error) {
    // Em caso de erro na base de dados, regista o erro no console e retorna null.
    console.error(`Erro ao procurar o inquilino '${subdomain}' na base de dados:`, error);
    return null;
  }
};

// Exporta a função para que possa ser usada por outros ficheiros (como o tenantIdentifier.js).
module.exports = {
  findTenantBySubdomain,
};

