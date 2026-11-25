# Василиса и Левиафан — сайт дилогии

Статический сайт романа-антиутопии Вас. Жданова: обе части онлайн, обложки, атмосфера, карта мира.

## Запуск

Нужен локальный HTTP-сервер (ридер грузит JSON):

```bash
cd d:\PYTHON\4-Sites\mybooks-site
python -m http.server 8080
```

Откройте http://localhost:8080/

## Структура

- `index.html` — главная
- `books/` — страницы частей
- `read/` — онлайн-ридер
- `world.html` — общины и фракции
- `data/part1.json`, `data/part2.json` — полный текст по главам
- `assets/` — обложки, арт, сгенерированная графика
- `robots.txt`, `ai.txt`, `llms.txt`, `sitemap.xml` — индексация поисковиками и ИИ

## Индексация

Перед публикацией в `robots.txt` и `sitemap.xml` замените `YOUR-DOMAIN` на ваш домен (например `https://example.ru`).

## Хостинг

GitHub Pages, домен `t-00.ru`.
