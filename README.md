# ⛓ ChainMind — Agentic Supply Chain Optimizer
### Capgemini AgentifAI Buildathon 2026

A multi-agent AI system that autonomously monitors, forecasts, and optimizes supply chains across 4 industries.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Orchestrator (CrewAI)             │
└────────┬──────────┬──────────┬──────────────┘
         ↓          ↓          ↓
   Monitor     Forecast    Procure      Alert
   Agent       Agent       Agent        Agent
         ↓          ↓          ↓            ↓
              Streamlit Dashboard
```

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate synthetic data
```bash
python generate_data.py
```

### 3. Run the dashboard
```bash
streamlit run app.py
```

### 4. (Optional) Enable real LLM
```bash
cp .env.example .env
# Add your OpenAI API key to .env
```
Then toggle "Use Real LLM" in the sidebar.

---

## 📁 Project Structure

```
chainmind/
├── app.py              # Main Streamlit dashboard
├── agents.py           # CrewAI multi-agent pipeline
├── forecaster.py       # Demand forecasting engine
├── generate_data.py    # Synthetic dataset generator
├── requirements.txt    # Python dependencies
├── .env.example        # API key template
└── data/               # Auto-generated CSV datasets
    ├── inventory.csv
    ├── demand_history.csv
    ├── suppliers.csv
    └── purchase_orders.csv
```

## 🏭 Industries Covered
- 💊 **Pharma** — Medicines, insulin, antibiotics
- 🛒 **FMCG** — Everyday consumer goods
- 🔧 **Auto Parts** — Brake pads, filters, belts
- 👟 **Retail** — Electronics, apparel, appliances

## 🤖 Agent Roles
| Agent | Responsibility |
|---|---|
| Monitor Agent | Scans inventory, flags CRITICAL/LOW items |
| Forecast Agent | 30-day demand prediction using ML |
| Procurement Agent | Auto-generates optimized purchase orders |
| Alert Agent | Real-time alerts to ops managers + exec reports |

## ✨ Key Features
- Multi-industry support (Pharma, FMCG, Auto Parts, Retail)
- Real-time inventory health monitoring
- ML-based 30-day demand forecasting
- Autonomous PO generation with supplier selection
- Supplier disruption detection + alternate routing
- Live disruption simulation
- Dark-mode executive dashboard
- Works without API key (simulation mode)

---
*Built for Capgemini AgentifAI Buildathon 2026*
