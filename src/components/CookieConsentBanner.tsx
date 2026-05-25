import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, Settings, X } from "lucide-react";

/**
 * NOTA LEGAL: Este componente é uma implementação técnica para conformidade com a LGPD.
 * O texto jurídico final, as categorias de cookies e a política de privacidade devem ser
 * revisados por um advogado especializado em proteção de dados.
 */

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentData {
  consent: boolean | "granular";
  preferences: CookiePreferences;
  timestamp: string;
  version: string;
}

const STORAGE_KEY = "lgpd_consent_v1";

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const savedConsent = localStorage.getItem(STORAGE_KEY);
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent) as CookieConsentData;
        // Se houver consentimento, poderíamos disparar os scripts aqui
        if (parsed.consent) {
          applyConsent(parsed.preferences);
        }
      } catch (e) {
        setShowBanner(true);
      }
    }

    // Expor função global para integração (ex: GTM)
    (window as any).updateConsentPreferences = (newPrefs: Partial<CookiePreferences>) => {
      const updated = { ...preferences, ...newPrefs, essential: true };
      saveConsent("granular", updated);
    };
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    // Respeitar Do Not Track do navegador
    if (navigator.doNotTrack === "1") {
      console.log("LGPD: DoNotTrack detectado. Scripts não essenciais bloqueados.");
      return;
    }

    // Placeholder para carregamento de scripts baseados em consentimento
    if (prefs.analytics) {
      console.log("LGPD: Carregando scripts analíticos...");
      // Ex: window.initGoogleAnalytics();
    }
    if (prefs.marketing) {
      console.log("LGPD: Carregando scripts de marketing...");
      // Ex: window.initFacebookPixel();
    }
  };

  const saveConsent = (type: boolean | "granular", prefs: CookiePreferences) => {
    const consentData: CookieConsentData = {
      consent: type,
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    applyConsent(prefs);
    setShowBanner(false);
    setShowModal(false);

    /**
     * INTEGRAÇÃO BACKEND:
     * Para registrar o consentimento em um servidor, envie um POST aqui:
     * fetch('/api/consent', {
     *   method: 'POST',
     *   body: JSON.stringify({ 
     *     hash: userHash, 
     *     preferences: prefs, 
     *     ip: 'masked', 
     *     timestamp: consentData.timestamp 
     *   })
     * });
     */
  };

  const handleAcceptAll = () => {
    const allIn: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(true, allIn);
  };

  const handleRejectNonEssential = () => {
    saveConsent(false, DEFAULT_PREFERENCES);
  };

  if (!showBanner && !showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-4 left-4 z-40 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
        aria-label="Gerenciar Cookies"
      >
        <ShieldCheck className="w-6 h-6 text-primary" />
      </button>
    );
  }

  return (
    <>
      {showBanner && (
        <div 
          role="dialog"
          aria-label="Consentimento de Cookies"
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Privacidade e Cookies
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Utilizamos cookies e tratamos dados pessoais para melhorar sua experiência, analisar tráfego e personalizar conteúdo. 
                Você pode aceitar todos, rejeitar os não essenciais ou personalizar suas preferências. 
                Seus direitos estão garantidos conforme a LGPD (Lei nº 13.709/2018).
                Consulte nossa <a href="/politica-de-privacidade" className="text-primary hover:underline underline-offset-4">Política de Privacidade Completa</a>.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" onClick={() => setShowModal(true)} className="flex-1 md:flex-none">
                <Settings className="w-4 h-4 mr-2" />
                Personalizar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRejectNonEssential} className="flex-1 md:flex-none text-slate-600 hover:text-red-500">
                Rejeitar Não Essenciais
              </Button>
              <Button onClick={handleAcceptAll} size="sm" className="flex-1 md:flex-none bg-primary hover:bg-primary/90">
                Aceitar Todos
              </Button>
            </div>
          </div>
        </div>
      )}

      <CookiePreferencesModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        preferences={preferences}
        setPreferences={setPreferences}
        onSave={(prefs) => saveConsent("granular", prefs)}
      />
    </>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: CookiePreferences;
  setPreferences: React.Dispatch<React.SetStateAction<CookiePreferences>>;
  onSave: (prefs: CookiePreferences) => void;
}

const CookiePreferencesModal = ({ isOpen, onClose, preferences, setPreferences, onSave }: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Preferências de Privacidade
          </DialogTitle>
          <DialogDescription>
            Personalize como tratamos seus dados. Algumas categorias são necessárias para o funcionamento do site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Essenciais */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Cookies Essenciais</h4>
              <p className="text-xs text-slate-500">
                Necessários para o funcionamento do site, como login, segurança e preenchimento de formulários. Não podem ser desativados.
              </p>
            </div>
            <Switch checked={true} disabled aria-label="Cookies Essenciais (Sempre ativo)" />
          </div>

          {/* Analíticos */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Cookies Analíticos</h4>
              <p className="text-xs text-slate-500">
                Ajudam-nos a entender como os visitantes interagem com o site, coletando informações de forma anônima para melhorias de performance.
              </p>
            </div>
            <Switch 
              checked={preferences.analytics} 
              onCheckedChange={(val) => setPreferences(prev => ({ ...prev, analytics: val }))}
              aria-label="Cookies Analíticos"
            />
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Marketing e Publicidade</h4>
              <p className="text-xs text-slate-500">
                Usados para rastrear visitantes em sites para exibir anúncios relevantes e personalizados.
              </p>
            </div>
            <Switch 
              checked={preferences.marketing} 
              onCheckedChange={(val) => setPreferences(prev => ({ ...prev, marketing: val }))}
              aria-label="Cookies de Marketing"
            />
          </div>

          {/* Preferências */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Preferências do Usuário</h4>
              <p className="text-xs text-slate-500">
                Permitem que o site se lembre de escolhas que você faz (como seu nome de usuário, idioma ou a região em que você está).
              </p>
            </div>
            <Switch 
              checked={preferences.preferences} 
              onCheckedChange={(val) => setPreferences(prev => ({ ...prev, preferences: val }))}
              aria-label="Preferências do Usuário"
            />
          </div>
        </div>

        <div className="text-[10px] text-slate-400 border-t pt-4">
          <p>Responsável: [NOME DA EMPRESA]</p>
          <p>DPO: [EMAIL DO ENCARREGADO/DPO]</p>
          <p>Endereço: [ENDEREÇO_DA_EMPRESA]</p>
          {/* 
            COMENTÁRIO JURÍDICO: Inserir aqui o link para o texto jurídico completo da Política de Privacidade.
            Exemplo: <a href="[URL_DA_POLITICA]">Leia mais</a>
          */}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="sm:flex-1">Cancelar</Button>
          <Button onClick={() => onSave(preferences)} className="sm:flex-1">Salvar Preferências</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
