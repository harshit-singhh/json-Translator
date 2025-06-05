# Translation Dashboard

The Translation Dashboard is a web-based tool designed to manage and translate JSON language files efficiently. It supports multi-language translation workflows, real-time editing, and seamless integration with translation APIs like OpenAI or Gemini. The platform simplifies localization efforts by allowing developers and translators to manage translations in one place.

## Features

🔤 Upload JSON language files and parse them into key-value pairs

🌍 Add new languages and auto-translate values using Gemini

✍️ Manually edit or add new translations via the dashboard

📥 Download translations per language in JSON format

📊 View and manage all translations in a dynamic table

🧠 Stores translation source metadata (e.g., Manual, OpenAI)

🗂️ Handles nested JSON keys by flattening them for database storage

## Technologies Used

### Frontend
Next.js – Server-side rendering & routing

React.js – Component-based UI

Tailwind CSS – Utility-first styling

Axios – HTTP requests

### Backend
Node.js – Runtime environment

Express.js – RESTful API development

### Database
MySQL – Relational database for storing language data

## Database Schema Overview

### uploadedfiles
Stores metadata about uploaded JSON files.

Fields: id, language_code, language_name, uploaded_at

### originaldata
Stores original key-value language pairs.

Fields: id, key_name, value, language_code

### translations
Stores translated values with source metadata.

Fields: id, Original_data_keys, Original_data_value, Original_Data_Language_Code, translated_value, translated_language_code, translated_by, translated_at





## Screenshots

![App Screenshot](https://raw.githubusercontent.com/harshit-singhh/json-Translator/refs/heads/main/images/Screenshot_1.png)

![App Screenshot](https://raw.githubusercontent.com/harshit-singhh/json-Translator/refs/heads/main/images/Screenshot_2.png)

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Screenshot_3.png?raw=true)

### Add Key Functionality

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Screenshot_4.png?raw=true)

### Translation Edit Functionality

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Screenshot_5.png?raw=true)

### Download Translation Functionality

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Screenshot_6.png?raw=true)

### Downloaded Language File

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Screenshot_7.png?raw=true)

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Gif%201.gif?raw=true)

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Gif%202.gif?raw=true)

![App Screenshot](https://github.com/harshit-singhh/json-Translator/blob/main/images/Gif%203.gif?raw=true)