const WhatsAppFloat = () => {
  return (
    <a
      href="https://wa.me/5598985880954?text=Olá! Gostaria de informações sobre passeios nos Lençóis Maranhenses."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 group"
      aria-label="Contato via WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="w-8 h-8 fill-current">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.052 9.38L1.056 31.2l6.076-1.952A15.914 15.914 0 0 0 16.004 32C24.824 32 32 24.824 32 16S24.824 0 16.004 0zm9.304 22.588c-.392 1.1-1.932 2.016-3.148 2.28-.832.18-1.916.324-5.568-1.196-4.676-1.944-7.688-6.688-7.924-6.996-.228-.308-1.872-2.492-1.872-4.756 0-2.264 1.184-3.38 1.604-3.84.392-.428.924-.58 1.188-.58.148 0 .28.004.4.012.428.016.644.04 1.004.86.228.52 1.14 2.776 1.24 2.976.104.2.172.432.036.692-.14.264-.208.392-.408.604-.2.212-.42.472-.6.632-.2.18-.408.376-.176.74.232.36 1.032 1.708 2.216 2.768 1.524 1.368 2.808 1.792 3.208 1.992.4.2.632.168.864-.1.236-.272 1.012-1.176 1.28-1.58.264-.4.532-.332.896-.2.368.136 2.32 1.096 2.716 1.296.4.2.664.3.764.468.096.168.096.968-.296 2.068z" />
      </svg>
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground animate-pulse">
        1
      </span>
    </a>
  );
};

export default WhatsAppFloat;
