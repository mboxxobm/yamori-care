# ヤモリ管理サイト

ヤモリ・ゲッコーの毎日の飼育記録を管理する、HTML/CSS/JavaScriptだけで動くローカルWebアプリです。

## 機能

- 個体ごとの名前、種類、性別、メモ登録
- 毎日の給餌記録
- コオロギ匹数、フード有無、食いつき状態、掃除、湿度交換、メモ保存
- 直近7日、30日の給餌履歴グラフ
- 全個体のコオロギ合計表示
- 食欲低下、コオロギ0匹継続アラート
- localStorage保存

## Alexa連携

Alexaで声入力してDynamoDBへ保存するための作業ファイルを追加しています。

- 音声モデル: `alexa/interaction-model-ja-JP.json`
- Alexa用Lambda: `aws/lambda/alexa-gecko-care/`
- Lambda権限例: `aws/iam/gecko-care-lambda-policy.json`
- 手順書: `docs/ALEXA_AWS_SETUP.md`

完成形では、Alexa SkillからAWS Lambdaを呼び、DynamoDB `GeckoCareEvents` に記録を保存します。

## 使い方

`index.html` をブラウザで開くと使えます。

GitHub Pagesで公開する場合は、リポジトリの Pages 設定で `main` ブランチのルートを公開してください。

## 初期データ

2026-05-09 の初期データをアプリ内に登録しています。GitHub側で作成されていた初回記録は `feeding-log/2026-05-09.md` にも残しています。
