# Flask CRUD API

Simple Flask server with GET, POST, PUT, DELETE endpoints using an in-memory store.

Quick start

1. Create and activate a virtualenv (Windows):

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Run the server:

```powershell
python main.py
```

3. Example requests:

- List items:

```bash
curl http://localhost:5000/items
```

- Create an item:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"First"}' http://localhost:5000/items
```

- Update an item:

```bash
curl -X PUT -H "Content-Type: application/json" -d '{"name":"Updated"}' http://localhost:5000/items/1
```

- Delete an item:

```bash
curl -X DELETE http://localhost:5000/items/1
```

Notes
- Data is stored in memory and resets on restart.
