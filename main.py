import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

app = FastAPI()

app.mount("/static", StaticFiles(directory="frontend", html=True), name="frontend")

DATABASE = "blackjack.db"
OUTPUT_FILE = "user_data.json"

# DB初期化
def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            current_stage INTEGER DEFAULT 1
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ユーザー登録用スキーマ
class UserRegister(BaseModel):
    username: str

# ステージクリア用スキーマ
class StageComplete(BaseModel):
    username: str
    stage: int
    victory: bool

from fastapi.responses import FileResponse

@app.get("/")
def read_index():
    return FileResponse("frontend/index.html")

# 登録 or 取得 API
@app.post("/register_or_get")
def register_or_get(user: UserRegister):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT current_stage FROM users WHERE username=?", (user.username,))
    row = c.fetchone()
    
    if row:
        # すでに存在する場合は登録せず情報だけ返す
        current_stage = row[0]
        conn.close()
        return {"message": "ユーザーは既に存在します", "current_stage": current_stage}
    else:
        # 存在しなければ登録
        c.execute("INSERT INTO users (username) VALUES (?)", (user.username,))
        conn.commit()
        conn.close()
        return {"message": f"{user.username} が登録されました", "current_stage": 1}

# ユーザー情報取得 API
@app.get("/user/{username}")
def get_user(username: str):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT current_stage FROM users WHERE username=?", (username,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    
    current_stage = row[0]
    stages = {str(i): i <= current_stage for i in range(1, 10)}
    return {"username": username, "stages": stages}

# ステージクリア API
@app.post("/complete_stage")
def complete_stage(data: StageComplete):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    c.execute("SELECT current_stage FROM users WHERE username=?", (data.username,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    
    current_stage = row[0]

    if data.victory and data.stage >= current_stage:
        new_stage = data.stage + 1 if data.stage < 9 else 9
        c.execute("UPDATE users SET current_stage=? WHERE username=?", (new_stage, data.username))
        conn.commit()
        current_stage = new_stage
    
    conn.close()

    stages = {str(i): i <= current_stage for i in range(1, 10)}
    return {"username": data.username, "stages": stages}

# ユーザー削除 API
@app.delete("/user/{username}")
def delete_user(username: str):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE username=?", (username,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    
    c.execute("DELETE FROM users WHERE username=?", (username,))
    conn.commit()
    conn.close()
    return {"message": f"{username} を削除しました"}

#JSONエクスポート（ユーザー情報のみ）
@app.post("/export_user")
def export_user(data: dict):
    username = data.get("username")
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT current_stage FROM users WHERE username=?", (username,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

    current_stage = row[0]
    user_data = {
        "username": username,
        "stages": {str(i): i <= current_stage for i in range(1, 10)}
    }

    return JSONResponse(content=user_data)