# Конфігурація Telegram fetcher:  
Щоб активувати збір повідомлень з каналу Telegram, створіть `backend/config.json` на основі `backend/config.example.json` і заповніть `api_id` та `api_hash`.
  
## Файли та структура:
`backend/app.py` — головний Flask додаток
  
`backend/fetcher.py` — фоновий/помічний скрипт для оновлення `schedule_history.json`, `schedule_today.json` та `schedule_tomorrow.json`
  
`backend/schedule_history.json` — збережена історія (для прикладу вже заповнена)  
  
#Запуск самого сайту
1. Відкрийте термінал безпосередньо в репозиторії light-ua
  
2. # Виконайте наступні команди:
```powershell
npm install  
npm run dev
```  
  
3. Відкрийте в браузері: http://localhost:5173/
