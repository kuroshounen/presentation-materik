/**
 * АТС МАЛИНОВКА × МАТЕРИК — ИНТЕРАКТИВНЫЙ ДВИЖОК ПРЕЗЕНТАЦИИ
 * Реализует:
 * 1. Физическую Canvas-симуляцию партнерских узлов (Slide 1)
 * 2. Управление слайдером (клавиатура, тач-свайпы, прогресс-бар, drawer)
 * 3. Интерактивный калькулятор дохода и RPC сети «Материк» (Slide 8)
 * 4. Плавную анимацию числовых метрик и счетчиков
 * 5. Вкладки и лайтбокс для скриншотов платформы MalinaFix (Slide 6)
 */

// ==========================================================================
// 1. ИНТЕРАКТИВНЫЙ CANVAS ПАРТНЕРСКИХ СВЯЗЕЙ (HERO CIRCUIT)
// ==========================================================================
class HeroNetworkCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.mouse = { x: -1000, y: -1000, active: false };
    this.animId = null;
    this.nodeCount = window.innerWidth < 768 ? 18 : 34;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    this.createNodes();
    this.start();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  createNodes() {
    this.nodes = [];
    // Цвета: терракота «Малиновки» и глубокий сапфир «Материка»
    const colors = [
      '#C07A56',                 // Терракота Малиновки
      '#004990',                 // Сапфир Материка
      '#2D5F3F',                 // Лесная хвоя
      'rgba(44, 24, 16, 0.45)'   // Древесный графит
    ];

    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 2,
        color: colors[i % colors.length],
        type: i % 2 === 0 ? 'malinovka' : 'materik'
      });
    }
  }

  start() {
    if (!this.animId) this.animate();
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > this.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.height) node.vy *= -1;

      // Плавная гравитация к курсору/тачу без дребезга (jitter)
      if (this.mouse.active) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 190 && dist > 0.5) {
          const force = Math.sin((dist / 190) * Math.PI);
          const step = Math.min(force * 2.2, dist * 0.12);
          node.x += (dx / dist) * step;
          node.y += (dy / dist) * step;
        }
      }

      // Отрисовка силовых линий между узлами
      for (let j = i + 1; j < this.nodes.length; j++) {
        const other = this.nodes[j];
        const dist = Math.hypot(node.x - other.x, node.y - other.y);

        if (dist < 150) {
          this.ctx.beginPath();
          this.ctx.moveTo(node.x, node.y);
          this.ctx.lineTo(other.x, other.y);

          // Связь Малиновка (терракота) + Материк (синий)
          const alpha = (1 - dist / 150) * 0.22;
          if (node.type !== other.type) {
            this.ctx.strokeStyle = `rgba(192, 122, 86, ${alpha * 1.3})`;
            this.ctx.lineWidth = 1.2;
          } else {
            this.ctx.strokeStyle = `rgba(0, 73, 144, ${alpha * 0.9})`;
            this.ctx.lineWidth = 0.9;
          }
          this.ctx.stroke();
        }
      }

      // Узел
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.fill();
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

// ==========================================================================
// 2. ДВИЖОК СЛАЙДЕРА И НАВИГАЦИИ (PRESENTATION SLIDER)
// ==========================================================================
class PresentationSlider {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.currentIndex = 0;
    this.totalSlides = this.slides.length;

    // Элементы интерфейса
    this.progressBar = document.getElementById('progressBar');
    this.counterEl = document.getElementById('slideCounter');
    this.titleEl = document.getElementById('slideTitleIndicator');
    this.btnPrev = document.getElementById('btnPrev');
    this.btnNext = document.getElementById('btnNext');
    this.dotsContainer = document.getElementById('dotsContainer');

    // Тач переменные
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 45;

    // Названия слайдов для индикатора и Drawer
    this.slideTitles = [
      'Введение · Стратегический альянс',
      '01 · От контрагентов к партнёрам',
      '02 · Нераскрытый потенциал базы',
      '03 · Ноль расходов и рисков',
      '04 · 3 формата рекомендаций',
      '05 · Платформа MalinaFix',
      '06 · Экономика комиссий 4%',
      '07 · Интерактивный калькулятор дохода',
      '08 · Win-Win эффект бумеранга',
      '09 · Дорожная карта и следующий шаг'
    ];

    this.init();
  }

  init() {
    this.buildDots();
    this.buildDrawer();
    this.bindKeyboard();
    this.bindTouch();
    this.bindButtons();
    this.updateUI();
  }

  buildDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < this.totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = `dot-btn ${i === 0 ? 'active' : ''}`;
      dot.title = `Слайд ${i + 1}: ${this.slideTitles[i] || ''}`;
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
    }
  }

  buildDrawer() {
    const listEl = document.getElementById('drawerList');
    if (!listEl) return;
    listEl.innerHTML = '';

    for (let i = 0; i < this.totalSlides; i++) {
      const item = document.createElement('div');
      item.className = `drawer-item ${i === 0 ? 'active' : ''}`;
      item.innerHTML = `
        <div class="drawer-item-left">
          <span class="drawer-item-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="drawer-item-title">${this.slideTitles[i] || `Слайд ${i + 1}`}</span>
        </div>
        <span style="font-size: 0.8rem; opacity: 0.5;">→</span>
      `;
      item.addEventListener('click', () => {
        this.goTo(i);
        closeModal('drawerModal');
      });
      listEl.appendChild(item);
    }
  }

  goTo(index) {
    if (index < 0 || index >= this.totalSlides || index === this.currentIndex) return;

    this.slides[this.currentIndex].classList.remove('active');
    this.currentIndex = index;
    this.slides[this.currentIndex].classList.add('active');

    // Сброс скролла слайда
    this.slides[this.currentIndex].scrollTop = 0;

    this.updateUI();
    this.onSlideChange(this.currentIndex);
  }

  next() {
    if (this.currentIndex < this.totalSlides - 1) {
      this.goTo(this.currentIndex + 1);
    } else {
      this.goTo(0);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  }

  bindButtons() {
    if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prev());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.next());
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Игнорируем нажатия при вводе в инпуты
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.goTo(this.totalSlides - 1);
      } else if (e.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  bindTouch() {
    window.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const deltaX = e.changedTouches[0].clientX - this.touchStartX;
      const deltaY = e.changedTouches[0].clientY - this.touchStartY;

      // Горизонтальный свайп с отсечением вертикального скролла
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
        if (deltaX < 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    }, { passive: true });
  }

  updateUI() {
    const cur = this.currentIndex;
    const tot = this.totalSlides;

    // Прогресс бар
    if (this.progressBar) {
      const percent = ((cur + 1) / tot) * 100;
      this.progressBar.style.width = `${percent}%`;
    }

    // Счетчик "01 / 10"
    if (this.counterEl) {
      this.counterEl.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(tot).padStart(2, '0')}`;
    }

    // Название в шапке
    if (this.titleEl) {
      this.titleEl.textContent = this.slideTitles[cur] || '';
    }

    // Кнопки Назад/Вперед
    if (this.btnPrev) this.btnPrev.disabled = cur === 0;
    if (this.btnNext) {
      if (cur === tot - 1) {
        this.btnNext.innerHTML = `<span>В начало ↺</span>`;
      } else {
        this.btnNext.innerHTML = `<span>Далее →</span>`;
      }
    }

    // Точки
    if (this.dotsContainer) {
      const dots = this.dotsContainer.querySelectorAll('.dot-btn');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === cur);
      });
    }

    // Drawer элементы
    const drawerItems = document.querySelectorAll('.drawer-item');
    drawerItems.forEach((item, idx) => {
      item.classList.toggle('active', idx === cur);
    });
  }

  onSlideChange(index) {
    // 1. Управление фоновым Canvas 1-го слайда
    if (window.heroNetwork) {
      index === 0 ? window.heroNetwork.start() : window.heroNetwork.stop();
    }

    // 2. Анимация счетчиков на слайдах с data-has-counters
    const activeSlide = this.slides[index];
    if (activeSlide && activeSlide.dataset.hasCounters) {
      activeSlide.querySelectorAll('.metric-number').forEach(el => animateCounter(el));
    }
  }
}

// ==========================================================================
// 3. ИНТЕРАКТИВНЫЙ КАЛЬКУЛЯТОР ВЫРУЧКИ И RPC СЕТИ «МАТЕРИК»
// ==========================================================================
function initCommissionCalculator() {
  const rangeInput = document.getElementById('calcContactsRange');
  const contactsDisplay = document.getElementById('calcContactsVal');
  const scenarioBtns = document.querySelectorAll('.scenario-btn');
  const crossSellCheckbox = document.getElementById('calcCrossSell');

  // Выходные метрики
  const heroRevenueDisplay = document.getElementById('calcHeroRevenue');
  const dealsCountDisplay = document.getElementById('calcDealsCount');
  const rpcDisplay = document.getElementById('calcRpcValue');
  const crossSellBonusDisplay = document.getElementById('calcCrossSellBonus');

  if (!rangeInput || !heroRevenueDisplay) return;

  let currentScenario = 'realistic'; // 'realistic' или 'optimized'

  function calculate() {
    const contacts = Number(rangeInput.value);
    contactsDisplay.textContent = new Intl.NumberFormat('ru-RU').format(contacts);

    // 1. Параметры сценариев (юнит-экономика строительного ритейла)
    // Линейка продуктов девелопера: подряд 11 млн ₽ (4% = 440 тыс. ₽), готовые дома 11–17 млн ₽ (до 680 тыс. ₽ в КП «Елизаветинское»).
    // Базовая модель усреднённого чека комиссии:
    // - Базовый сценарий: ~1.7 сделки на 1000 контактов (1 подряд + 0.7 дома) = ~804 000 ₽ выручки на 1000 контактов.
    // - Оптимизированный сценарий: 3.0 сделки на 1000 контактов (2 подряда + 1 дом) = ~1 400 000 ₽ выручки на 1000 контактов.
    let dealsPer1000 = 0;
    let baseRevenuePer1000 = 0;

    if (currentScenario === 'realistic') {
      dealsPer1000 = 1.7;
      baseRevenuePer1000 = 804000;
    } else {
      dealsPer1000 = 3.0;
      baseRevenuePer1000 = 1400000;
    }

    const scale = contacts / 1000;
    const totalDeals = Math.max(1, Math.round(dealsPer1000 * scale * 10) / 10);
    let totalRevenue = Math.round(baseRevenuePer1000 * scale);

    // 2. Дополнительные сопутствующие услуги (Trade-in вторички + ремонт под ключ)
    let crossSellRevenue = 0;
    if (crossSellCheckbox && crossSellCheckbox.checked) {
      // Ремонт 5% от 2 млн (~100-150k) + Trade-in (~30-60k) = ~260 тыс. ₽ на 1000 контактов
      crossSellRevenue = Math.round(260000 * scale);
      totalRevenue += crossSellRevenue;
    }

    const rpc = Math.round(totalRevenue / contacts);

    // Форматирование
    const formatter = new Intl.NumberFormat('ru-RU');
    heroRevenueDisplay.textContent = `${formatter.format(totalRevenue)} ₽`;
    if (dealsCountDisplay) dealsCountDisplay.textContent = `${totalDeals} ${getDealsWord(totalDeals)}`;
    if (rpcDisplay) rpcDisplay.textContent = `${formatter.format(rpc)} ₽`;
    if (crossSellBonusDisplay) {
      crossSellBonusDisplay.textContent = crossSellRevenue > 0 
        ? `+${formatter.format(crossSellRevenue)} ₽` 
        : '0 ₽';
    }
  }

  // Слушатели событий
  rangeInput.addEventListener('input', calculate);

  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scenarioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScenario = btn.dataset.scenario;
      calculate();
    });
  });

  if (crossSellCheckbox) {
    crossSellCheckbox.addEventListener('change', calculate);
  }

  calculate();
}

function getDealsWord(num) {
  // В русском языке дробные числительные (1.7, 3.4, 5.1 и т.д.) всегда управляют родительным падежом ед. числа: «сделки»
  if (num % 1 !== 0) return 'сделки';
  const n = Math.abs(Math.round(num));
  if (n % 10 === 1 && n % 100 !== 11) return 'сделка';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'сделки';
  return 'сделок';
}

// ==========================================================================
// 4. ПЛАВНАЯ АНИМАЦИЯ ЧИСЛОВЫХ СЧЕТЧИКОВ
// ==========================================================================
function animateCounter(element) {
  const target = Number(element.dataset.target);
  const suffix = element.dataset.suffix || '';
  const prefix = element.dataset.prefix || '';
  const duration = 1400;
  const start = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.round(target * ease);

    element.textContent = `${prefix}${currentVal.toLocaleString('ru-RU')}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// ==========================================================================
// 5. ТАБЫ И ЛАЙТБОКС ДЛЯ СКРИНШОТОВ MALINAFIX
// ==========================================================================
function initMalinafixTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn[data-target-img]');
  const previewImg = document.getElementById('malinafixPreviewImg');

  if (!previewImg) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetSrc = btn.dataset.targetImg;
      const altText = btn.dataset.altText || '';

      previewImg.style.opacity = '0.4';
      setTimeout(() => {
        previewImg.src = targetSrc;
        previewImg.alt = altText;
        previewImg.style.opacity = '1';
      }, 150);
    });
  });
}

// Управление модальными окнами
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('open');
  });
}

function openLightbox(imageSrc, caption) {
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');

  if (lightboxModal && lightboxImg) {
    lightboxImg.src = imageSrc;
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    lightboxModal.classList.add('open');
  }
}

// Полноэкранный режим
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }
}

// ==========================================================================
// 6. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ DOM
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Инициализация Canvas сети
  window.heroNetwork = new HeroNetworkCanvas('heroNetworkCanvas');

  // 2. Инициализация слайдера
  window.presentationSlider = new PresentationSlider();

  // 3. Инициализация калькулятора
  initCommissionCalculator();

  // 4. Инициализация вкладок MalinaFix
  initMalinafixTabs();

  // 5. Обработчики открытия Drawer меню
  const btnDrawer = document.getElementById('btnOpenDrawer');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerOverlay = document.getElementById('drawerModal');

  if (btnDrawer) btnDrawer.addEventListener('click', () => openModal('drawerModal'));
  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', () => closeModal('drawerModal'));
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeModal('drawerModal');
    });
  }

  // 6. Обработчики Лайтбокса
  const lightboxModal = document.getElementById('lightboxModal');
  const btnCloseLightbox = document.getElementById('btnCloseLightbox');
  const previewImg = document.getElementById('malinafixPreviewImg');

  if (previewImg) {
    previewImg.addEventListener('click', () => {
      openLightbox(previewImg.src, previewImg.alt);
    });
  }

  if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', () => closeModal('lightboxModal'));
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeModal('lightboxModal');
    });
  }

  // 7. Полноэкранный режим
  const btnFullscreen = document.getElementById('btnFullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullScreen);
  }
});
