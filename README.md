# BlackJack

### ユーザー登録画面
データベースにユーザー名とステージクリア状況が保存されます。
<img width="1139" height="716" alt="bj_img1" src="https://github.com/user-attachments/assets/ffe7b2cc-48fe-4f94-87fe-c3d78d0d2bd8" />

### ステージ選択画面
ステージを選択します。難易度の変化はありません。１ステージクリアごとに次のステージが解放されます。
ユーザー削除ボタンでユーザー情報が削除され、ユーザー名とそれに結びついたクリア状況データがデータベースから削除されます。
結果出力ボタンでユーザー情報をJSON形式で出力することができます。ファイルにはユーザー名とステージの解放状況が含まれます。
<img width="1107" height="873" alt="bj_img2" src="https://github.com/user-attachments/assets/247e9427-fb2a-4104-9139-746e6e279bde" />

### ゲームプレイ画面
Hit/Standを選択することができます。ライフがなくなるとゲームオーバー、ディーラーのライフがなくなるとゲームクリアです。
ディーラーは17に達するまでヒットを続けます。
<img width="1107" height="1130" alt="bj_img3" src="https://github.com/user-attachments/assets/c05c7cfc-c659-48a6-9a8d-d0747f551c97" />

### 構成
HTML/CSS/JS(Vue.js)+FastAPI+sqlite3
FastAPI側でサーバーを立ててブラウザからアクセスします。

### 
