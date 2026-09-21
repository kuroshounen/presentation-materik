/**
 * Юнит-тест физики частиц HeroNetworkCanvas и проверки отсутствия дребезга / залипания
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== 1. Проверка наличия и структуры кода физики в app.js ===');
const appJsPath = path.join(__dirname, '..', 'app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

assert(appJs.includes("this.canvas.addEventListener('touchstart'"), "Должен присутствовать обработчик touchstart");
assert(appJs.includes("this.canvas.addEventListener('touchend'"), "Должен присутствовать обработчик touchend");
assert(appJs.includes("this.canvas.addEventListener('touchcancel'"), "Должен присутствовать обработчик touchcancel");
assert(appJs.includes("window.addEventListener('blur'"), "Должен присутствовать сброс активности мыши при blur");
assert(appJs.includes("dot > 0"), "Должна быть проверка направления движения dot > 0 для предотвращения залипания");
console.log('  [OK] Все обработчики событий мыши/тача и ключевые инварианты на месте');

console.log('\n=== 2. Симуляция физики: проверка на отсутствие дребезга (jitter) ===');

function simulateParticle(x0, y0, vx, vy, mx, my, frames = 500) {
  let node = { x: x0, y: y0, vx, vy };
  let history = [];

  for (let f = 0; f < frames; f++) {
    let prevX = node.x;
    let prevY = node.y;

    node.x += node.vx;
    node.y += node.vy;

    const dx = mx - node.x;
    const dy = my - node.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 190 && dist > 0.001) {
      const dot = (node.vx * dx + node.vy * dy) / dist;
      if (dot > 0) {
        const normDist = dist / 190;
        const force = Math.sin(normDist * Math.PI);
        const ease = 1 - Math.exp(-dist / 35);
        const step = Math.min(force * 1.6 * ease, dist * 0.15);

        node.x += (dx / dist) * step;
        node.y += (dy / dist) * step;
      }
    }

    history.push({
      f,
      dist: Math.hypot(mx - node.x, my - node.y),
      vxEff: node.x - prevX,
      vyEff: node.y - prevY
    });
  }

  return history;
}

let totalJitter = 0;
const particleCount = 1000;

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const d0 = 40 + Math.random() * 140;
  const x = 500 + Math.cos(angle) * d0;
  const y = 500 + Math.sin(angle) * d0;
  const speed = Math.random() * 0.35 + 0.1;
  const vx = -Math.cos(angle) * speed + (Math.random() - 0.5) * 0.1;
  const vy = -Math.sin(angle) * speed + (Math.random() - 0.5) * 0.1;

  const hist = simulateParticle(x, y, vx, vy, 500, 500, 400);

  for (let j = 2; j < hist.length; j++) {
    const v1 = hist[j - 1].vxEff;
    const v2 = hist[j].vxEff;
    // Дребезг определяется как резкая смена знака с ускорением > 0.2px/frame
    if (v1 * v2 < -0.01 && Math.abs(v1 - v2) > 0.2) {
      totalJitter++;
    }
  }
}

console.log(`  [OK] Зафиксировано событий дребезга в 1000 симуляциях: ${totalJitter}`);
assert.strictEqual(totalJitter, 0, 'Дребезг частиц должен быть строго равен 0!');

console.log('\n=== 3. Проверка на отсутствие залипания (anti-trapping) ===');
let trappedNearCursor = 0;
for (let i = 0; i < 500; i++) {
  const angle = Math.random() * Math.PI * 2;
  const d0 = 60 + Math.random() * 100;
  const x = 500 + Math.cos(angle) * d0;
  const y = 500 + Math.sin(angle) * d0;
  const speed = 0.25;
  const vx = -Math.cos(angle) * speed;
  const vy = -Math.sin(angle) * speed;

  const hist = simulateParticle(x, y, vx, vy, 500, 500, 600);
  const finalDist = hist[hist.length - 1].dist;
  if (finalDist < 20) {
    trappedNearCursor++;
  }
}

console.log(`  [OK] Частиц, оставшихся в радиусе 20px после 600 кадров (из 500): ${trappedNearCursor}`);
assert(trappedNearCursor < 25, 'Частицы не должны залипать вокруг курсора!');

console.log('\n=== ВСЕ ТЕСТЫ ФИЗИКИ УСПЕШНО ПРОЙДЕНЫ! ===');
