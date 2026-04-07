# AmplifyCRM

## Overview
AmplifyCRM is a dynamic CRM frontend powered by Base44.  
The server injects pages, components, and configuration at runtime, enabling flexible and multi-tenant UI generation.

---

## 🧠 Architecture

- React + Vite  
- TailwindCSS + Radix UI  
- React Query (data fetching)  
- Zod (validation)  

---

## ⚙️ How It Works

1. Server generates:
   - `__components__/`
   - `__pages__/`
   - `__app.config.js`

2. `App.jsx`:
   - Loads config  
   - Dynamically renders UI  

---

## 📦 Example Config

```js
export default {
  pages: [
    { name: 'Dashboard', path: '/' }
  ],
  components: []
}
