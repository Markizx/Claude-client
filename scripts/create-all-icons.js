const fs = require('fs');
const path = require('path');

// Создаем директорию для ассетов
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// SVG шаблон для иконки
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6e56cf;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5a47b8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" rx="64"/>
  <circle cx="256" cy="256" r="128" fill="white" opacity="0.9"/>
  <text x="256" y="296" font-family="Arial, sans-serif" font-size="200" font-weight="bold" 
        text-anchor="middle" fill="#6e56cf">C</text>
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="36" 
        text-anchor="middle" fill="white" opacity="0.8">Claude Desktop</text>
</svg>`;

// Простой PNG генератор (как base64)
const pngBase64 = `iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABBQSURBVHgB7d0JlFXVmQbwf+99VTUwCIqCgksQRRBEJQ6JJm6JaxKNS1xiNKOJJjMmk3Eyk5hJMslklknGJJNM4pJJNCs6Ro1bXOIWt7jERVFUFAQENwRkEGSo7fdne6q6m6JYaq3z/3+d06271FvU/d93733vu88FhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEII/8DLaI+XR/8BhMhGV9vJfRMAAABPdFJOUwBOLpDSKzX7hhcj8iwuSEwPF8a3nHs6Mzk7AH0Hfn6BgOgBBoNzEAQBAgPFAgIDBL9YCgoFAgIEBgYABnQ=`;

// Сохраняем файлы
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);

// Создаем basic PNG файл (будет нужен для Linux)
// В реальной ситуации используйте конвертер
fs.writeFileSync(path.join(assetsDir, 'icon-basic.png'), Buffer.from(pngBase64, 'base64'));

// Создаем ICO файл (простая заглушка)
const icoData = Buffer.alloc(1024); // Пустой ICO файл
fs.writeFileSync(path.join(assetsDir, 'icon-basic.ico'), icoData);

console.log('✅ Созданы базовые иконки:');
console.log('   - assets/icon.svg');
console.log('   - assets/icon-basic.png'); 
console.log('   - assets/icon-basic.ico');
console.log('');
console.log('📝 Для полной функциональности создайте настоящие иконки:');
console.log('   1. Используйте онлайн конвертеры SVG → ICO/PNG/ICNS');
console.log('   2. Или инструмент electron-icon-maker:');
console.log('      npm install -g electron-icon-maker');
console.log('      electron-icon-maker --input=assets/icon.svg --output=assets/');
console.log('');
console.log('📁 Переименуйте созданные файлы:');
console.log('   - icon-basic.ico → icon.ico (для Windows)');
console.log('   - icon-basic.png → icon.png (для Linux)');
console.log('   - Создайте icon.icns для macOS');

// Создаем еще один скрипт для автоматического копирования
const setupIconsScript = `
# Скрипт для настройки иконок приложения
# После создания правильных иконок запустите этот скрипт

echo "Настройка иконок Claude Desktop..."

# Проверка наличия файлов
if [ -f "assets/icon.svg" ]; then
    echo "✅ SVG иконка найдена"
else
    echo "❌ SVG иконка не найдена"
fi

# Копирование basic файлов если настоящих нет
if [ ! -f "assets/icon.ico" ]; then
    if [ -f "assets/icon-basic.ico" ]; then
        cp assets/icon-basic.ico assets/icon.ico
        echo "✅ Скопирован basic ICO файл"
    fi
fi

if [ ! -f "assets/icon.png" ]; then
    if [ -f "assets/icon-basic.png" ]; then
        cp assets/icon-basic.png assets/icon.png
        echo "✅ Скопирован basic PNG файл"
    fi
fi

echo "🏁 Настройка иконок завершена"
echo "💡 Для лучшего качества замените basic файлы на настоящие иконки"
`;

fs.writeFileSync(path.join(__dirname, '..', 'scripts', 'setup-icons.sh'), setupIconsScript);
console.log('✅ Создан скрипт setup-icons.sh');

// Создаем README для иконок
const iconReadme = `# Иконки приложения

Эта папка содержит иконки для Claude Desktop приложения.

## Файлы

- \`icon.svg\` - Векторная иконка (исходная)
- \`icon.ico\` - Иконка для Windows  
- \`icon.png\` - Иконка для Linux
- \`icon.icns\` - Иконка для macOS

## Создание иконок

### Автоматически (рекомендуется)

\`\`\`bash
npm install -g electron-icon-maker
electron-icon-maker --input=assets/icon.svg --output=assets/
\`\`\`

### Вручную

1. Откройте \`icon.svg\` в графическом редакторе
2. Экспортируйте в нужные форматы:
   - 256x256 PNG для Linux
   - ICO файл для Windows (рекомендуется многомасштабный)
   - ICNS файл для macOS

### Онлайн конвертеры

- [SVG to ICO](https://convertio.co/svg-ico/)
- [SVG to PNG](https://convertio.co/svg-png/)
- [PNG to ICNS](https://convertio.co/png-icns/)

## Размеры

- Windows ICO: 16x16, 32x32, 48x48, 256x256
- macOS ICNS: 16x16, 32x32, 128x128, 256x256, 512x512
- Linux PNG: 256x256 или больше
`;

fs.writeFileSync(path.join(assetsDir, 'README.md'), iconReadme);
console.log('✅ Создан README.md для иконок');