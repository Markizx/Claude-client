
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
