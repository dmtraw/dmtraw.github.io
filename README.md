# Портфолио плейблов — dmtraw.github.io

Плейблы и обложки лежат здесь только в зашифрованном виде (`vault/`, AES-GCM, ключ из пароля через PBKDF2).
Открытые исходники в репозиторий НЕ кладём.

## Добавить плейбл
1. Исходники (не в репозитории): папка с `playables.js` и `playables/<folder>/index.html` (+ `cover.jpg`, 9:16).
2. Добавь строку в `playables.js`:
   `{ title: "Merge Cats", folder: "merge-cats", cover: "cover.jpg", tags: "Cocos · 2026" },`
   (`land: true` для горизонтальных)
3. Собери: `PORTFOLIO_PASSWORD='...' node tools/build.mjs /путь/к/исходникам`
4. Закоммить папку `vault/`.

Ссылка с паролем внутри: `https://dmtraw.github.io/#k=ПАРОЛЬ`
