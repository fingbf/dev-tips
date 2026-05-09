# プロジェクトルール — dev-tips

## ⚠️ 重要: このリポジトリは main へのコミット直後に本番環境へ自動デプロイされる

**コミット = 本番リリース** であるため、いかなる変更もコミット前に必ずレビューを行うこと。

---

## コミットフロー（必須）

```
変更完了
  → code-reviewer エージェントでレビュー（フォアグラウンド実行）
  → WARNING 以上の指摘があれば修正
  → ユーザーへ結果報告
  → ユーザー確認後にコミット & プッシュ
```

- JSON 値の修正・追記など「単純な変更」でも省略不可
- ビルドエラーは build-error-resolver エージェントで解決してからコミット

---

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Vitest（単体テスト）

---

## TBS（東方華心伝）データ管理

データファイル: `src/data/games/tbs/`

### patch スクリプトの既知バグ（再実行時は手動修正が必要）

`patch_tbs_params.py`（デスクトップ）を再実行した後、以下を手動で修正すること:

| ファイル | id | 名前 | キー | 正しい値 |
|---------|----|----|------|---------|
| items.json | 157 | 浮世金輪 | Damage | 64 |
| skills.json | 260 | 腐蝕波動 | FogDamage | 34 |

**原因:** 複数の DamageInfo が同一キーを持つ場合、interval=0 のエントリが DPS 計算値を上書きする。

### params / levelParams の値の規則

- パーセンテージ系（AtkBoost, DamageBoost, CritRate 等）: × 100 した整数で保存（例: 15% → 15）
- 負値は使わない: desc が「増加」「減少」で方向を表現するため、値は常に正値
- `<attr=Key>` タグ: PCTAGE_ATTR_KEYS に含まれるキーはコンポーネントが自動で `%` を付加
