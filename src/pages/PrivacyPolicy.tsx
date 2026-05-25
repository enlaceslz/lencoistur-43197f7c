import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText, Scale } from "lucide-react";

/**
 * NOTA LEGAL: Este é um modelo de Política de Privacidade para fins de demonstração técnica.
 * O conteúdo abaixo deve ser revisado e adaptado por um advogado especializado em 
 * proteção de dados para refletir as práticas reais da sua empresa.
 */

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-24">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
          <header className="mb-12 border-b border-slate-100 dark:border-slate-800 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Política de Privacidade e Proteção de Dados
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Última atualização: 25 de maio de 2026
            </p>
          </header>

          <section className="space-y-12">
            {/* 1. Introdução */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Shield className="w-6 h-6" />
                <h2 className="text-xl font-semibold">1. Compromisso com a sua Privacidade</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Nós da <strong>[NOME DA EMPRESA]</strong> levamos a sério a proteção dos seus dados pessoais. 
                Esta política descreve como coletamos, usamos, processamos e protegemos suas informações em 
                conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </div>

            {/* 2. Coleta de Dados */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Eye className="w-6 h-6" />
                <h2 className="text-xl font-semibold">2. Informações que Coletamos</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Coletamos dados necessários para fornecer nossos serviços de turismo e experiências:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                <li><strong>Dados de Identificação:</strong> Nome completo, CPF/Passaporte, data de nascimento.</li>
                <li><strong>Contato:</strong> E-mail, telefone, endereço residencial.</li>
                <li><strong>Dados de Pagamento:</strong> Processados de forma segura via parceiros certificados (Stripe/Cielo).</li>
                <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador, cookies e preferências de uso.</li>
              </ul>
            </div>

            {/* 3. Uso dos Dados */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                <FileText className="w-6 h-6" />
                <h2 className="text-xl font-semibold">3. Finalidade do Tratamento</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Utilizamos seus dados para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                <li>Processar reservas de passeios e emissão de vouchers.</li>
                <li>Garantir sua segurança durante as atividades (SGS - Sistema de Gestão de Segurança).</li>
                <li>Comunicar alterações em itinerários ou confirmações.</li>
                <li>Cumprir obrigações legais e regulatórias do setor de turismo.</li>
                <li>Melhorar nossa plataforma através de análises estatísticas anônimas.</li>
              </ul>
            </div>

            {/* 4. Segurança */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Lock className="w-6 h-6" />
                <h2 className="text-xl font-semibold">4. Segurança dos Dados</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Implementamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, 
                perda, alteração ou qualquer forma de tratamento inadequado. Utilizamos criptografia SSL/TLS em todas as 
                transações e armazenamos dados em servidores seguros (Lovable Cloud/Supabase).
              </p>
            </div>

            {/* 5. Direitos do Usuário */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Scale className="w-6 h-6" />
                <h2 className="text-xl font-semibold">5. Seus Direitos (LGPD)</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Você tem o direito de, a qualquer momento:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                <li>Confirmar a existência de tratamento de seus dados.</li>
                <li>Acessar seus dados pessoais.</li>
                <li>Corrigir dados incompletos ou desatualizados.</li>
                <li>Solicitar a anonimização ou exclusão de dados desnecessários.</li>
                <li>Revogar o consentimento a qualquer momento.</li>
              </ul>
            </div>

            {/* 6. Contato DPO */}
            <div className="mt-16 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-2">Canal do Titular de Dados</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Para exercer seus direitos ou tirar dúvidas, entre em contato com nosso Encarregado de Dados (DPO):
                <br />
                <strong>Nome:</strong> [NOME DO ENCARREGADO]
                <br />
                <strong>E-mail:</strong> [EMAIL DO ENCARREGADO/DPO]
                <br />
                <strong>Endereço:</strong> [ENDEREÇO_DA_EMPRESA]
              </p>
            </div>
          </section>

          <footer className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              &copy; 2026 [NOME DA EMPRESA]. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;