# Деплой + адмінка LORIASHVILI

Сайт — статичний (HTML/CSS/JS, без збірки). Контент, який редагує клієнтка,
винесено в `content/*.json`. Скрипт `js/content.js` підставляє його в сторінки.
Адмінка — **Decap CMS** (безкоштовна, open-source) на `/admin/`, працює через GitHub:
кожна правка клієнтки = коміт у репозиторій → Netlify автоматично передеплоює сайт.

Все безкоштовно: GitHub (репо) + Netlify (хостинг) + Decap (CMS).

---

## Крок 1. Залити репозиторій на GitHub

Репо вже ініціалізовано і зроблено перший коміт. Залишилось створити репо на GitHub і запушити.

Через GitHub CLI (найшвидше):
```bash
cd ~/Documents/GitHub/LORIASHVILI
gh auth login          # один раз, увійти в акаунт kgomasa2
gh repo create loriashvili --public --source=. --remote=origin --push
```

Або вручну: створи порожній репозиторій `loriashvili` на github.com, потім:
```bash
git remote add origin https://github.com/kgomasa2/loriashvili.git
git branch -M main
git push -u origin main
```

> Якщо github-акаунт/назва репо інші — заміни `kgomasa2/loriashvili`
> у файлі **`admin/config.yml`** (рядок `repo:`).

---

## Крок 2. Підключити Netlify (хостинг + автодеплой)

1. Зайди на https://app.netlify.com → **Add new site → Import an existing project**.
2. Обери **GitHub** → репозиторій `loriashvili`.
3. Налаштування збірки лишити порожніми:
   - **Build command:** *(порожньо)*
   - **Publish directory:** `.`
4. **Deploy**. За хвилину сайт буде на `https://<щось>.netlify.app`.
   Можна перейменувати: *Site configuration → Change site name* (напр. `loriashvili`).

Кожен наступний push у `main` (у т.ч. правки з адмінки) деплоїться автоматично.

---

## Крок 3. Увімкнути вхід в адмінку (GitHub OAuth через Netlify)

Щоб клієнтка могла логінитись у `/admin/`, треба один раз під'єднати GitHub-логін.

**3.1. Створити GitHub OAuth App**
- GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
- **Application name:** LORIASHVILI CMS
- **Homepage URL:** `https://<твій-сайт>.netlify.app`
- **Authorization callback URL:** `https://api.netlify.com/auth/done`
- **Register** → скопіювати **Client ID**, згенерувати **Client Secret**.

**3.2. Додати ці ключі в Netlify**
- Netlify → твій сайт → **Site configuration → Access & security → OAuth**
  (розділ «Authentication providers» / «Install provider»)
- **Install provider → GitHub** → вставити **Client ID** і **Client Secret** → Save.

Готово. Тепер `https://<сайт>.netlify.app/admin/` → **Login with GitHub** працює.

---

## Крок 4. Дати доступ клієнтці

Щоб клієнтка могла редагувати, її GitHub-акаунт має мати доступ на запис у репо:
- GitHub → репо `loriashvili` → **Settings → Collaborators → Add people** →
  додати її github-нік (роль **Write**).
- Вона заходить на `.../admin/`, тисне **Login with GitHub**, приймає інвайт — і редагує.

Якщо GitHub-акаунта в неї нема — най створить безкоштовний на github.com.

---

## Що саме редагується в адмінці

**«Сайт — тексти та посилання»** (`content/site.json`)
- Bio коротке (hero) і повне (About)
- Посилання: Instagram, OnlyFans, Email, Telegram (оновлюються по всьому сайту)
- Списки **Media** і **Exhibitions**

**«Проєкти (кейси)»** (`content/projects.json`)
- 6 блоків на головній: заголовок + прев'ю-зображення.
- Поля `key` і `url` **не міняти** (вони прив'язані до верстки/сторінок).

**«Шоп (товари)»** (`content/shop.json`)
- Каталог: назва, ціна, видавець, характеристики, обкладинка, головне фото.
- Зміни відображаються і в каталозі `/shop/`, і на сторінці товару.
- Поле `slug` **не міняти**.

### Межі редагування (важливо)
- **Галереї фото** на сторінках товарів (`/shop/<товар>/`) і проєктів
  зверстані вручну під конкретні розміри/позиції — вони **не редагуються через CMS**.
  Додати/поміняти фото в галереї = задача розробнику.
- **Додати новий товар/проєкт** через CMS створить запис у JSON, але **окрему
  сторінку** (`/shop/новий/`) треба зверстати окремо. Редагування наявних —
  повністю через адмінку.
- Блок карток шопу на головній — декоративний, статичний (реальний каталог у `/shop/`).

---

## Локальна перевірка
```bash
cd ~/Documents/GitHub/LORIASHVILI
python3 -m http.server 4173
# відкрити http://localhost:4173
```
(Адмінка `/admin/` локально не залогіниться — GitHub OAuth працює лише на бойовому домені.)
