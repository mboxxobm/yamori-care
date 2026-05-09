# Alexa + AWS セットアップ

このアプリの完成形は、Alexaで声入力した記録をAWS DynamoDBに保存し、家族用Webアプリから同じデータを見る構成です。

## 推奨構成

```text
Alexa Skill
  -> AWS Lambda
  -> DynamoDB: GeckoCareEvents

GitHub Pages / 家族用Webアプリ
  -> API Gateway
  -> AWS Lambda
  -> DynamoDB: GeckoCareEvents
```

Alexa-hosted Node.jsは初期テストには便利ですが、家族用Webアプリと同じAWSアカウントのDynamoDBを使う完成形では、自分のAWSアカウントに作ったLambdaをAlexa SkillのEndpointにする方が管理しやすいです。

## すでに作成済み

- DynamoDB table: `GeckoCareEvents`
- Partition key: `familyId` String
- Sort key: `createdAt` String
- Region: `us-east-1`

## 次に作るLambda

AWS Consoleで `Lambda` を開き、関数を作成します。

- Function name: `gecko-care-alexa-handler`
- Runtime: Node.js 18.x または Node.js 20.x
- Region: `us-east-1`

環境変数:

```text
TABLE_NAME=GeckoCareEvents
FAMILY_ID=laggy-family
```

コードは `aws/lambda/alexa-gecko-care/index.js` を使います。

## Lambda権限

Lambdaの実行ロールに、`aws/iam/gecko-care-lambda-policy.json` 相当の権限を追加します。

最低限必要なDynamoDB権限:

```text
dynamodb:PutItem
dynamodb:Query
dynamodb:GetItem
```

対象テーブル:

```text
GeckoCareEvents
```

## Alexa Skill側

Alexa Developer Consoleで、やもりケアのSkillを開きます。

1. Build
2. Interaction Model
3. JSON Editor
4. `alexa/interaction-model-ja-JP.json` の内容を貼る
5. Save Model
6. Build Model

その後:

1. Endpoint
2. AWS Lambda ARN
3. Default Region に `gecko-care-alexa-handler` のARNを貼る
4. Save Endpoints

## テスト発話

Alexa Developer ConsoleのTestで、開発中に切り替えて試します。

```text
やもりケアを開いて
福ちゃんにコオロギ2匹
ここあちゃんが脱皮した
コオロギフード交換
最後のコオロギはいつ
福ちゃんの最後のコオロギはいつ
```

## DynamoDB確認

DynamoDB Consoleで:

```text
GeckoCareEvents
-> Explore table items
```

`familyId = laggy-family` の記録が増えていれば保存成功です。
