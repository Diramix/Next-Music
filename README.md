# Next Music

Next Music — Веб клиент Яндекс Музыки с поддержкой тем оформлений и аддонов, оптимизироованный под новый дизайн!

## Скриншоты
![image](https://github.com/user-attachments/assets/5a2903ad-f755-4da0-8c25-27402e97a19a)

### Скачивание Node.js

- Скачать Node.js можно по [этой ссылке](https://nodejs.org/dist/v21.7.3/node-v21.7.3-x64.msi)

>[!NOTE]
>Также Node.js нужна при использовании собранного приложения.

### Установка git
- Скачать git можно по [этой ссылке](https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe)

### Клонирование репозитория

```bash
git clone https://github.com/Web-Next-Music/Next-Music-Client
cd Next-Music-Client
```

### Установка зависимостей

Установите все необходимые зависимости с помощью npm:

# Установка electron
```bash
npm install electron --save-dev
```

```bash
npm install
```

## Сборка приложения

Чтобы собрать приложение, выполните следующую команду:

```bash
npm run make
```

Собранный `.exe` файл будет находиться в папке `dist`.

## Установка тем и аддонов

Скачать расширения (темы и аддоны) можно из репозитория [Next Music Extensions](https://github.com/Web-Next-Music/Next-Music-Extensions)

Переместите файлы аддонов в папку по пути `%LOCALAPPDATA%\Next Music\Addons`. Допустимы под-папки

## DANGER ZONE

>[!WARNING]
>Если вы знаете JavaScript, то НИКОГДА не смотрите файл `index.js`!!!
>
>Вы сблюёте себе на клаву...
