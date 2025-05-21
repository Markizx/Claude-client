const fs = require('fs');
const path = require('path');

// Источники и назначения для копирования
const filesToCopy = [
  {
    src: 'electron/main.js',
    dest: 'build/electron.js'
  },
  {
    src: 'electron/preload.js',
    dest: 'build/preload.js'
  }
];

// Директории для копирования
const dirsToCopy = [
  {
    src: 'electron/ipc',
    dest: 'build/electron/ipc'
  },
  {
    src: 'db',
    dest: 'build/db'
  }
];

// Функция копирования файла
function copyFile(src, dest) {
  try {
    // Проверяем существование исходного файла
    if (!fs.existsSync(src)) {
      console.warn(`Исходный файл не найден: ${src}`);
      return false;
    }

    // Создаем директорию назначения если её нет
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(src, dest);
    console.log(`Скопирован: ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.error(`Ошибка копирования ${src}:`, error.message);
    return false;
  }
}

// Функция копирования директории
function copyDir(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      console.warn(`Директория не найдена: ${src}`);
      return false;
    }
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    
    console.log(`Скопирована директория: ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.error(`Ошибка копирования директории ${src}:`, error.message);
    return false;
  }
}

// Главная функция
function main() {
  console.log('Начинаем копирование файлов Electron...');
  
  let success = true;
  
  // Создаем build директорию если её нет
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build', { recursive: true });
  }
  
  // Копируем отдельные файлы
  console.log('\n=== Копирование отдельных файлов ===');
  filesToCopy.forEach(({ src, dest }) => {
    if (!copyFile(src, dest)) {
      success = false;
    }
  });
  
  // Копируем директории
  console.log('\n=== Копирование директорий ===');
  dirsToCopy.forEach(({ src, dest }) => {
    if (!copyDir(src, dest)) {
      success = false;
    }
  });
  
  // Обновляем package.json в build директории для правильного main
  console.log('\n=== Обновление package.json ===');
  try {
    const buildPackageJsonPath = path.join('build', 'package.json');
    const packageData = {
      name: "claude-desktop",
      main: "electron.js",
      homepage: "./"
    };
    
    fs.writeFileSync(buildPackageJsonPath, JSON.stringify(packageData, null, 2));
    console.log('Создан package.json в build директории');
  } catch (error) {
    console.error('Ошибка создания package.json:', error.message);
    success = false;
  }
  
  if (success) {
    console.log('\n✅ Копирование завершено успешно!');
  } else {
    console.log('\n❌ Копирование завершено с ошибками!');
    process.exit(1);
  }
}

// Запускаем только если скрипт вызван напрямую
if (require.main === module) {
  main();
}

module.exports = { main, copyFile, copyDir };