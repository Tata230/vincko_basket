# vincko_basket
Компонент корзина для страниц карточка КОМПЛЕКТА ОБОРУДВАНИЯ и карточка ГОТОВОГО РЕШЕНИЯ
1. Подтягиваем зависимости с помощью команды npm install
2. Настравиаем путь деплоя в файле package.json, где devX площадка разработчика
```json
"deploy": "rollup -c; curl -k 'sftp://94.228.123.233/home/bitrix/ext_www/devX.vincko.market/local/templates/v_new_template/css/' --user 'login:password' -T 'public/build/basket.js' --ftp-create-dirs"
```
## Список команд
1. npm run build - cборка компонента
2. npm run deploy - для сборки компонента и деплоя на заданный удаленный сервер (см п.2)
