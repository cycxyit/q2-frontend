# Qbit Ecommerce - Backend

This is the Node.js + Express backend for the Qbit Ecommerce shop.

## 🚀 Deploy to Vercel

You can deploy this backend directly to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F[YOUR_GITHUB_USERNAME]%2F[YOUR_REPO_NAME]&root-directory=backend&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,JWT_SECRET,SPREADSHEET_ID)

> **⚠️ 注意 / Note:**
>
> 部署前，请确保你已经把项目推送到 GitHub。你需要把上方部署按钮链接中的 `[YOUR_GITHUB_USERNAME]` 和 `[YOUR_REPO_NAME]` 替换为你自己真实的 GitHub 用户名和仓库名。

### Environment Variables (环境变量)

在点击部署按钮后，Vercel 会自动要求你填入以下环境变量：

- `TURSO_DATABASE_URL`: Turso (libSQL) 云数据库连接地址
- `TURSO_AUTH_TOKEN`: Turso 数据库的 Auth Token 凭证
- `JWT_SECRET`: 用于加密 Admin 登录状态的密钥（例如 `ecommerce_secret_key_123`）
- `SPREADSHEET_ID`: 你的 Google Sheets 表格 ID（用于记录订单信息）

---

## 本地开发 (Local Development)

1. 安装依赖:
   ```bash
   npm install
   ```
2. 运行开发服务器 (支持热更新):
   ```bash
   npm run dev
   ```
