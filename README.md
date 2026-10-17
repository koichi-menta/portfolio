# Koichiのポートフォリオ

プロフィールや制作実績、これまでの歩みを紹介するポートフォリオサイトです。

## 掲載内容

- プロフィール・スキル
- 制作したサービスやアプリ
- 活動のタイムライン
- よくある質問

## 遊び心のある演出

ドーパミンモードでは、実績カードのパック開封や、山を登るタイムラインなどの演出を楽しめます。

## 開発環境

Node.js 24とYarn 1.22.22を使用します。Node.jsのパッチバージョンは`.node-version`、
Yarnのバージョンは`package.json`の`packageManager`で固定しています。

```sh
corepack enable
yarn install --frozen-lockfile
yarn dev
```

変更後は`yarn typecheck`、`yarn lint`、`yarn test:review`、`yarn build`で確認します。
GitHub Actionsでも`.node-version`のNode.jsで同じチェックを実行します。

デプロイ先もNode.js 24に揃えてください。`package.json`の`engines.node`に`24.x`を指定していますが、
ホスティングサービス側に独立したNode.js設定がある場合は、その設定も確認してください。

## セキュリティチェック

Dependabot、Dependency Review、CodeQL、Gitleaksで依存関係・コード・シークレットを検査します。
GitHub側で必要な初期設定と検出時の対応は[運用手順](.github/SECURITY_CHECKS.md)を参照してください。
