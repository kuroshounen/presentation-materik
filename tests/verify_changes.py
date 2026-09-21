import os
import re

def verify():
    html_path = "index.html"
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    js_path = "app.js"
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    css_path = "styles.css"
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    print("=== 1. Проверка существования файлов-ассетов ===")
    srcs = set(re.findall(r'(?:src|href)=["\'](assets/[^"\']+)["\']', html))
    missing = [src for src in srcs if not os.path.exists(src)]
    print(f"Всего ассетов: {len(srcs)}")
    for src in sorted(srcs):
        print(f"  [OK] {src} (размер: {os.path.getsize(src)} байт)")
    if missing:
        raise AssertionError(f"Отсутствуют файлы: {missing}")

    print("\n=== 2. Проверка слайдов (все 10) ===")
    slides = re.findall(r'<section[^>]*class=["\'][^"\']*slide[^"\']*["\'][^>]*data-index=["\'](\d+)["\']', html)
    print(f"Найдено слайдов: {len(slides)} с индексами {slides}")
    assert len(slides) == 10, f"Ожидалось 10 слайдов, найдено {len(slides)}"
    assert slides == [str(i) for i in range(10)], f"Неверная нумерация: {slides}"

    print("\n=== 3. Проверка удаления старых текстов и значений ===")
    forbidden = [
        "520 000 ₽", "520000", "13 млн ₽", "13 000 000 ₽",
        "640-00-40", "partners@malinovka", "Обводного",
        "Мы уже ваш клиент", "закупает материалы в",
        "в 38% случаев", "15–25% маржи", "15-25%"
    ]
    for item in forbidden:
        assert item not in html, f"Обнаружен старый текст в HTML: {item}"
        print(f"  [OK] '{item}' отсутствует в HTML")

    print("\n=== 4. Проверка обязательных новых элементов ===")
    required_in_html = [
        "680 000 ₽", "680000", "17 000 000 ₽",
        "Следующий этап", "от контрагентов", "партнёрам",
        'sawoda-facade.jpg',
        'sawoda-interior.jpg',
        'sawoda-terrace-v3.png',
        'favicon.svg',
        "Гражданский пр. 26 офис 4А-6 (4 этаж)", "+7(812)2-700-700", "atsmalinovka@yandex.ru",
        "14–21 день",
        "Согласование брендированных стоек и рекламных материалов"
    ]
    for item in required_in_html:
        assert item in html, f"Не найден обязательный элемент в HTML: {item}"
        print(f"  [OK] '{item}' присутствует в HTML")

    print("\n=== 5. Проверка состояния калькулятора по умолчанию ===")
    # Checkbox must not have checked
    assert '<input type="checkbox" id="calcCrossSell">' in html, "Чекбокс должен быть без checked"
    assert '<input type="checkbox" id="calcCrossSell" checked>' not in html, "Чекбокс не должен содержать checked"
    # Scenario realistic must be active
    assert '<button type="button" class="scenario-btn active" data-scenario="realistic">' in html, "Базовый сценарий должен быть активен в HTML"
    assert '<button type="button" class="scenario-btn active" data-scenario="optimized">' not in html, "Оптимизированный сценарий не должен быть active в HTML"
    assert "let currentScenario = 'realistic';" in js, "В app.js currentScenario должен быть 'realistic'"
    print("  [OK] Калькулятор: по умолчанию сценарий 'realistic', галочка снята")

    print("\n=== 6. Проверка названий слайдов в app.js ===")
    assert "'01 · От контрагентов к партнёрам'" in js, "В app.js slideTitles[1] должен быть '01 · От контрагентов к партнёрам'"
    print("  [OK] app.js slideTitles[1] обновлён корректно")

    print("\nВСЕ 6 ПРОВЕРОК УСПЕШНО ПРОЙДЕНЫ!")

if __name__ == "__main__":
    verify()
