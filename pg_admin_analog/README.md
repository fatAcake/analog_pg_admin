# PostgreSQL Admin - ASP.NET Core + React JS

Простое веб-приложение для управления базами данных PostgreSQL с использованием ASP.NET Core и React.

## Функционал

1. **Подключение к базе данных** - Ввод строки подключения для соединения с PostgreSQL
2. **Создание баз данных** - Создание новых баз данных через интерфейс
3. **Управление таблицами** - Создание, просмотр и удаление таблиц
4. **Операции с данными** - INSERT, UPDATE, DELETE через интерфейс или SQL запросы
5. **SQL Запросы** - Выполнение произвольных SQL запросов

## Структура проекта

```
pg_admin_analog/
├── pg_admin_analog.Server/      # ASP.NET Core backend
│   ├── Controllers/
│   │   └── DatabaseController.cs
│   ├── Services/
│   │   └── DatabaseService.cs
│   ├── Models/
│   │   └── DatabaseModels.cs
│   └── Program.cs
└── pg_admin_analog.client/      # React frontend
    └── src/
        ├── components/
        │   ├── ConnectionForm.jsx
        │   ├── DatabaseManager.jsx
        │   ├── TableManager.jsx
        │   ├── SqlQueryEditor.jsx
        │   └── DataOperations.jsx
        ├── services/
        │   └── api.js
        └── App.jsx
```

## Требования

- .NET 9.0 SDK
- Node.js (последняя LTS версия)
- PostgreSQL сервер

## Установка

### Backend (ASP.NET Core)

1. Откройте терминал в папке `pg_admin_analog.Server`
2. Установите пакеты:
   ```bash
   dotnet restore
   ```
3. Запустите сервер:
   ```bash
   dotnet run
   ```

### Frontend (React)

1. Откройте терминал в папке `pg_admin_analog.client`
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите приложение в режиме разработки:
   ```bash
   npm run dev
   ```

## Использование

### 1. Подключение к базе данных

Введите строку подключения в формате:
```
Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=ваш_пароль
```

Или используйте расширенный формат:
```
Server=localhost;Port=5432;Database=mydb;User Id=myuser;Password=mypassword;
```

### 2. Управление базами данных

- Просмотр списка существующих баз данных
- Создание новой базы данных

### 3. Управление таблицами

- Просмотр списка таблиц в выбранной схеме
- Создание новой таблицы с указанием колонок и типов данных
- Удаление таблиц

### 4. Работа с данными

#### Через интерфейс:
- **INSERT** - Добавление новых записей в таблицу
- **UPDATE** - Обновление существующих записей по условию WHERE
- **DELETE** - Удаление записей по условию WHERE

#### Через SQL запросы:
- Выполнение любых SQL запросов (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP и т.д.)
- Быстрые шаблоны запросов

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/database/test-connection` | Проверка подключения |
| GET | `/api/database/databases` | Получить список БД |
| POST | `/api/database/databases` | Создать БД |
| GET | `/api/database/tables` | Получить список таблиц |
| GET | `/api/database/schemas` | Получить список схем |
| POST | `/api/database/tables` | Создать таблицу |
| DELETE | `/api/database/tables/{schema}/{table}` | Удалить таблицу |
| GET | `/api/database/tables/{schema}/{table}/data` | Получить данные таблицы |
| POST | `/api/database/query` | Выполнить SQL запрос |
| POST | `/api/database/tables/{schema}/{table}/insert` | Вставить данные |
| PUT | `/api/database/tables/{schema}/{table}/update` | Обновить данные |
| DELETE | `/api/database/tables/{schema}/{table}/delete` | Удалить данные |

## Безопасность

⚠️ **Важно**: Это учебное приложение. Для продакшена необходимо:
- Добавить аутентификацию и авторизацию
- Валидировать все входные данные
- Использовать параметризованные запросы (уже реализовано)
- Ограничить доступ к чувствительным операциям
- Добавить логирование действий

## Технологии

- **Backend**: ASP.NET Core 9.0, Npgsql
- **Frontend**: React 18, Vite
- **База данных**: PostgreSQL

## Лицензия

MIT
