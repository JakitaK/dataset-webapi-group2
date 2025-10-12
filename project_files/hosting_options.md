# Hosting Options for a Node.js/Express + Postgres Web API

This document evaluates **two free cloud options** for hosting our Web API and (in later sprints) a PostgreSQL database. It includes **pros/cons**, our **HelloWorld demos**, and a **recommendation**.

---

## TL;DR
- **Render (Web Service + Managed Postgres)** — Best fit for a traditional Express server and a managed Postgres instance on one platform.  
- **Vercel (Serverless Functions + External Postgres)** — Great for low-latency, auto-scaling serverless endpoints; pair with Neon/Supabase/Render for Postgres.

---

## Option A — Render (Express Web Service + Managed Postgres)

**What it is:** Render runs long-lived **Node/Express** services and offers **Managed PostgreSQL**.

### Pros
- Native Express support (no serverless conversion)  
- Managed PostgreSQL on the same platform  
- GitHub auto-deploys on push  
- Simple build/start (`npm install` / `npm start`)

### Cons
- Free services **sleep** when idle → cold start delay  
- Limited RAM/CPU and DB storage on free tier  
- Fewer regions on free tier

### HelloWorld (Render)
- **URL:** https://helloworld-api-testing.onrender.com/api/hello  
- **Result:** `{"message":"Hello from Group 2 👋"}`

---

## Option B — Vercel (Serverless Functions + External Postgres)

**What it is:** Vercel runs **serverless functions** with instant scaling. Use an **external Postgres** (Neon/Supabase/Render) for DB.

### Pros
- Fast cold starts; auto-scaling  
- Great GitHub integration & previews  
- Low ops overhead

### Cons
- Not a persistent Express server by default (adapt to serverless handlers)  
- No local filesystem persistence; not for long-running jobs  
- Must provision Postgres elsewhere

### HelloWorld (Vercel)
- **URL:** https://hello-world-api-testing-1gub.vercel.app/api/hello  
- **Result:** `{"message":"Hello from Group 2 👋"}`

---

## Demos (Proof)
```bash
# Vercel
curl https://hello-world-api-testing-1gub.vercel.app/api/hello
# Render
curl https://helloworld-api-testing.onrender.com/api/hello

