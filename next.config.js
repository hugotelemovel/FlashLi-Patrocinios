/** @type {import('next').NextConfig} */
module.exports = {
  // Incluir o PDF base e a fonte nas funções que geram o dossier
  outputFileTracingIncludes: {
    '/api/dossier': ['./assets/**/*'],
    '/api/send-proposal': ['./assets/**/*'],
  },
};
