export class PWAInstaller {
  constructor(elements) {
    this.elements = elements;
    this.deferredPrompt = null;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.show();
    });

    this.elements.installBtn.addEventListener('click', () => this.install());
    this.elements.dismissBtn.addEventListener('click', () => this.dismiss());
  }

  show() {
    this.elements.installPrompt.classList.add('show');
  }

  hide() {
    this.elements.installPrompt.classList.remove('show');
  }

  async install() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.hide();
  }

  dismiss() {
    this.hide();
  }
}
