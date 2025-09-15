const { findTenantBySubdomain } = require('../services/tenantService');

/**
 * Middleware para identificar o inquilino (tenant) com base no subdomínio do pedido.
 * Ele procura as informações do inquilino na base de dados master e anexa-as ao objeto 'req'.
 */
const tenantIdentifier = async (req, res, next) => {
  try {
    // 1. Extrai o subdomínio do nome do anfitrião (ex: "tecnotoolingteste" de "tecnotoolingteste.localhost:3000")
    const host = req.headers.host;
    const subdomain = host.split('.')[0];

    // 2. Procura as informações do inquilino no serviço, que por sua vez consulta o MongoDB
    const tenant = await findTenantBySubdomain(subdomain);

    // 3. Valida se o inquilino foi encontrado
    // Se não for encontrado, o acesso à rota do inquilino é bloqueado.
    if (!tenant) {
      // É importante ter uma página de erro ou uma mensagem clara aqui
      return res.status(404).send(`<h1>Erro 404</h1><p>Cliente não encontrado para o subdomínio '${subdomain}'.</p>`);
    }

    // 4. Anexa as informações do inquilino ao objeto 'req'
    // A partir daqui, todas as rotas subsequentes terão acesso a req.tenant
    req.tenant = tenant;

    // 5. Se tudo correu bem, passa para a próxima função (a rota do controller)
    next();

  } catch (error) {
    console.error("❌ Erro crítico no middleware de identificação:", error);
    return res.status(500).send("Ocorreu um erro interno no servidor ao identificar o cliente.");
  }
};

module.exports = tenantIdentifier;

