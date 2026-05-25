# .agents/skills/deploy-coolify/SKILL.md

# Deploy no Coolify

Este guia descreve como realizar o deploy desta aplicação no Coolify usando Docker.

## Pré-requisitos
- Uma instância do Coolify instalada e configurada.
- Acesso ao repositório Git do projeto.

## Passos para Deploy

1. **Criar um novo recurso**:
   - Vá para o seu projeto no Coolify.
   - Clique em **+ New Resource** -> **Public Repository** (ou Private se configurado).
   - Insira a URL do seu repositório.

2. **Configuração de Build**:
   - O Coolify detectará automaticamente o `Dockerfile`.
   - Certifique-se de que o **Build Pack** está definido como `docker`.

3. **Variáveis de Ambiente**:
   - No Coolify, vá para a aba **Environment Variables**.
   - Adicione as seguintes variáveis necessárias pelo Supabase:
     - `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
     - `VITE_SUPABASE_ANON_KEY`: A chave anônima (anon key) do seu projeto Supabase.

4. **Configurações Adicionais**:
   - Certifique-se de que a porta exposta no Coolify está configurada como `80` (conforme definido no `Dockerfile`).
   - Configure o domínio/FQDN desejado para a aplicação.

5. **Deploy**:
   - Clique em **Deploy** e acompanhe os logs de build.

## Arquivos Criados para o Deploy
- `Dockerfile`: Configura o build multi-stage para gerar os arquivos estáticos com Node.js e servir com Nginx.
- `nginx.conf`: Configuração do Nginx para suportar roteamento SPA (Single Page Application).
