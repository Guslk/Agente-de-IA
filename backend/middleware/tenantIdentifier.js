// ===================================================
// MIDDLEWARE DE IDENTIFICAÇÃO DO INQUILINO (middleware/tenantIdentifier.js)
// Responsável por extrair o subdomínio e encontrar o inquilino correspondente.
// ===================================================

const { findTenantBySubdomain } = require('../services/tenantService');

const tenantIdentifier = async (req, res, next) => {
  const host = req.headers.host; // ex: "tecnotoolingteste.localhost:3000"
  
  // --- LOG DE VERIFICAÇÃO 1 ---
  console.log(`\n[VERIFICAÇÃO] Novo pedido recebido. Host: ${host}`);

  if (!host) {
    return res.status(400).send("Pedido inválido sem cabeçalho Host.");
  }

  // Extrai a primeira parte do host (o subdomínio)
  const subdomain = host.split('.')[0].toLowerCase();
  
  // --- LOG DE VERIFICAÇÃO 2 ---
  console.log(`[VERIFICAÇÃO] Subdomínio extraído: '${subdomain}'`);

  // Ignora subdomínios comuns ou vazios para não os tratar como inquilinos
  if (!subdomain || ['www', 'app', ''].includes(subdomain)) {
    console.log(`[VERIFICAÇÃO] Subdomínio ignorado. A passar para a próxima rota.`);
    return next(); 
  }

  try {
    // Usa o serviço para encontrar o inquilino no banco de dados
    const tenant = await findTenantBySubdomain(subdomain);

    if (!tenant) {
      // --- LOG DE VERIFICAÇÃO 3 (FALHA) ---
      console.error(`[VERIFICAÇÃO] ❌ Inquilino NÃO encontrado para o subdomínio: '${subdomain}'`);
      return res.status(404).send(`Cliente com o subdomínio '${subdomain}' não foi encontrado.`);
    }

    // --- LOG DE VERIFICAÇÃO 3 (SUCESSO) ---
    console.log(`[VERIFICAÇÃO] ✅ Inquilino encontrado: ${tenant.name}`);
    
    // Anexa as informações do inquilino e o ID ao objeto 'req'
    // para que possam ser usados noutras partes da aplicação (controladores, etc.)
    req.tenant = tenant;
    req.tenantId = tenant.subdomain; // Adiciona o ID para fácil acesso
    
    return next();

  } catch (error) {
    console.error(`[VERIFICAÇÃO] ❌ Ocorreu um erro no middleware:`, error.message);
    return res.status(500).send('Erro interno do servidor.');
  }
};

module.exports = tenantIdentifier;

