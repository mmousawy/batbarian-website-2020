export default class MobileTopbar {
  constructor(options) {
    const defaultOptions = {
      headerSelector: '.topbar',
      menuStuckClass: 'is-stuck',
      menuHiddenClass: 'is-hidden',
      menuAnchoredClass: 'is-anchored',
      menuOpenClass: 'is-menu-open',
      menuStartTopClass: 'start-top',
      menuNoAnimationClass: 'no-animation'
    };

    console.log('asd');

    this.debounceTimer;
    this.debounceTimeOut = 150;
    this.throttleTimeOut = 100;
    this.prevTime = 0;

    this.prevScrollY = 0;

    this.options = Object.assign(defaultOptions, options);

    this.header = document.querySelector(this.options.headerSelector);

    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('scroll', this.throttleScroll.bind(this), { passive: true });
  }

  throttleScroll() {
    requestAnimationFrame(now => {
      if (now - this.prevTime > this.throttleTimeOut) {
        this.scrollHandler();

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(this.scrollHandler.bind(this), this.debounceTimeOut);

        this.prevTime = now;
      }
    });
  }

  scrollHandler() {
    if (window.innerWidth > 1024) {
      return;
    }

    console.log('asd');

    this.scrollY = Math.max(0, window.scrollY ? window.scrollY : document.documentElement.scrollTop);

    const scrollDelta = this.prevScrollY - scrollY;

    if (scrollDelta < -15) {
      // Scrolling down
      if (!this.header.classList.contains(this.options.menuStuckClass)) {
        this.header.classList.remove(this.options.menuStuckClass);
      }

      if (this.scrollY > 100) {
        if (this.header.classList.contains(this.options.menuAnchoredClass)) {
          this.header.classList.remove(this.options.menuAnchoredClass);
          this.header.classList.remove(this.options.menuStartTopClass);
          this.header.classList.add(this.options.menuNoAnimationClass);

          clearTimeout(this.resetTimer);
          clearTimeout(this.resetTimer2);
          void this.header.offsetWidth;
        }

        this.header.classList.add(this.options.menuHiddenClass);
        this.header.classList.add(this.options.menuStuckClass);
        this.header.classList.remove(this.options.menuNoAnimationClass);
      }
    } else if (scrollDelta > 15) {
      // Scrolling up
      if (!this.header.classList.contains(this.options.menuStuckClass)) {
        this.header.classList.add(this.options.menuStuckClass);
      }
      this.header.classList.remove(this.options.menuHiddenClass);
    }

    if (this.scrollY < 1) {
      this.header.classList.remove(this.options.menuStuckClass);

      this.resetTimer = setTimeout(() => {
        this.header.classList.add(this.options.menuAnchoredClass);

        this.resetTimer2 = setTimeout(() => {
          this.header.classList.add(this.options.menuStartTopClass);
        }, 300);
      }, 300);
    }

    this.prevScrollY = scrollY;
  }
}
