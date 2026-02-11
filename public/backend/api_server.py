from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from address_search_api import AddressSearchEngine

app = Flask(__name__)
CORS(app)

# Інструкція для роботи пошуку адреси:
# 1) Запусти сервер: він слухає http://127.0.0.1:5001
# 2) З фронтенду виклич POST /api/search-address
# 3) Тіло запиту (JSON): {"address": "вул.Героїв Дніпра 31"}
# 4) Приклад запиту:
#    fetch("http://127.0.0.1:5001/api/search-address", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({address: "..."})})
# 5) Якщо знайдено: {"found": true, "queue": "1.1", "queue_label": "1 черга, I підчерга"}
# 6) Якщо не знайдено: {"found": false, "message": "Адресу не знайдено в жодній черзі"}
PDF_DIR = Path(__file__).resolve().parent.parent / "chergu"
print(f"Ініціалізація движка пошуку...")
search_engine = AddressSearchEngine(str(PDF_DIR))
print(f"✓ Готово до роботи!")


@app.route('/api/search-address', methods=['POST'])
def search_address():
    try:
        data = request.get_json()
        
        if not data or 'address' not in data:
            return jsonify({
                "error": "Не вказано адресу",
                "message": "Надішліть JSON з полем 'address'",
            }), 400
        
        query_address = data['address'].strip()
        
        if not query_address:
            return jsonify({
                "error": "Порожня адреса",
                "message": "Адреса не може бути порожньою",
            }), 400
        
        result = search_engine.search_simple(query_address)
        
        print(f"Запит: '{query_address}' -> {'Знайдено' if result['found'] else 'Не знайдено'} "
              f"{result.get('queue', '')}")
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Помилка: {e}")
        return jsonify({
            "error": "Внутрішня помилка сервера",
            "message": str(e),
        }), 500



@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "pdf_files_loaded": len(search_engine.cache),
        "queues": [data['queue'] for data in search_engine.cache.values()],
    })


@app.route('/', methods=['GET'])
def index():
    return """
    <h1>API для пошуку адрес у чергах відключення</h1>
    
    <h2>Endpoints:</h2>
    
    <h3>POST /api/search-address</h3>
    <pre>
    Request:
    {
        "address": "вул.Героїв Дніпра 31"
    }
    
    Response:
    {
        "found": true,
        "address": "вул.Героїв Дніпра 31",
        "queue": "1.1",
        "queue_label": "1 черга, I підчерга",
        "confidence": 0.95
    }
    </pre>
    
    <h3>GET /api/health</h3>
    <p>Перевірка статусу сервера</p>
    
    <hr>
    <p>Завантажено PDF файлів: <strong>""" + str(len(search_engine.cache)) + """</strong></p>
    """


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
    )
