# セキュリティチェックの運用

## 自動チェック

| チェック | 対象・動作 | 実行タイミング |
| --- | --- | --- |
| Dependency Review | PRで追加・更新する依存関係を検査し、High / Criticalの既知の脆弱性で失敗する。開発用依存も対象 | 全PR |
| CodeQL | JavaScript / TypeScriptを`security-extended`で解析し、結果をGitHubのSecurityタブに登録する | 全PR、mainへのpush、毎週月曜09:30 JST、手動 |
| Gitleaks | コミットに含まれるシークレットを検出すると失敗する。PR・pushは変更範囲、定期・手動実行は取得した全履歴を検査する | 全PR、mainへのpush、毎週月曜10:00 JST、手動 |
| Dependabot | npm（Yarnの`package.json` / `yarn.lock`）とGitHub Actionsの更新PRを作る | 毎週月曜09:00 JST |

ActionsはコミットSHAで固定し、Dependabotで更新する。Gitleaks本体のバージョンは
`workflows/gitleaks.yml`の`GITLEAKS_VERSION`で管理し、定期的に更新する。
スキャン結果のPRコメント投稿とGitleaksレポートのartifact保存は無効にしている。
Gitleaksのログでは検出したシークレット値がマスクされる。

## GitHub側で必要な初期設定

以下は設定ファイルだけでは有効にならないため、リポジトリのSettingsで確認する。

1. Securityの設定で、Dependency graph、Dependabot alerts、Dependabot security updatesを有効にする。
   これにより、PRに変更がなくても既存依存の新しい脆弱性通知と、対応可能な場合の修正PRを受け取れる。
   `dependabot.yml`の週次スケジュールは通常のバージョン更新用であり、脆弱性監視の頻度ではない。
2. CodeQLのDefault setupを使っている場合は無効にし、このリポジトリのワークフローによるAdvanced setupを使う。
3. マージ後、ActionsからGitleaksを手動実行し、全履歴を初回検査する。
4. 各チェックが一度実行された後、mainのRulesetまたはBranch protectionで
   `Dependency Review`と`Gitleaks`を必須ステータスチェックにする。
5. CodeQLの検出結果を確認・整理してから、mainのRulesetの
   `Require code scanning results`でCodeQLを指定し、High / Criticalをブロックする。
   `CodeQL (JavaScript / TypeScript)`の成功は解析処理の成功を意味し、脆弱性がないことは保証しない。
   コードスキャンによるマージ制限を設定できない場合は、Securityタブの新規指摘をレビューで確認する。

定期実行はデフォルトブランチにマージされた後に始まる。GitHub側で実行が遅延する場合がある。
この構成は現在の公開・個人所有リポジトリ向け。非公開化やOrganizationへの移管時は、
CodeQL / Dependency Reviewの利用条件とGitleaks Actionのライセンス条件を確認する。

## 検出時の対応

- High / Criticalを優先して修正し、依存の更新後は既存テストとビルドを確認してからマージする。
  通常のDependabot PRも自動マージせず、変更内容と動作を確認する。
- シークレットが見つかった場合は、先に該当キーを失効・再発行する。
  ファイルから削除しても履歴に残るため、削除のみで対応完了としない。
- 誤検知を除外する場合は、対象を限定し、理由と見直し期限をPRに記録する。
- 過去のPRにあったSnyk表示だけでは現在の稼働状態は判断できない。
  GitHub AppsとSnyk側の設定を確認し、同じ依存検査が重複する場合は運用する側を決める。
  この変更ではSnykの外部連携設定は変更していない。
