# ⛓ ChainMind — Agentic Supply Chain Optimizer
### Autonomous Multi-Agent Supply Chain Orchestration

**ChainMind** is a cutting-edge multi-agent AI system designed to autonomously monitor, forecast, and optimize supply chains. It leverages advanced agentic workflows to handle complex logistics and inventory management across four key industries: Pharma, FMCG, Auto Parts, and Retail.

---

## 📖 Brief Description
ChainMind is an intelligent platform built for operations managers and executive decision-makers who require real-time visibility and autonomous decision-making in their supply chains. By utilizing a swarm of specialized AI agents, the project automates routine inventory health checks, predicts future demand with ML models, and generates optimized procurement strategies. It is particularly valuable for businesses looking to enhance resilience against global supply disruptions through proactive simulation and automated alternate sourcing.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Premium Design System with Glassmorphism)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend & AI
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Agent Orchestration**: [CrewAI](https://www.crewai.com/)
- **Dashboard (Admin)**: [Streamlit](https://streamlit.io/)
- **Data Processing**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Machine Learning**: [Scikit-learn](https://scikit-learn.org/)
- **Data Generation**: [Faker](https://faker.readthedocs.io/)
- **Server**: [Uvicorn](https://www.uvicorn.org/)

---

## 📁 Folder Structure

```text
chainmind/
├── agents.py           # CrewAI multi-agent pipeline and agent roles
├── app.py              # Executive Streamlit dashboard
├── forecaster.py       # ML demand forecasting engine
├── generate_data.py    # Synthetic dataset generator
├── server.py           # FastAPI backend serving the React frontend
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variable template
├── data/               # Persistent CSV storage (Inventory, Demand, Suppliers, POs)
└── frontend/           # Modern React + Vite application
    ├── src/            # Application source code
    │   ├── components/ # Reusable UI components
    │   ├── hooks/      # Custom React hooks
    │   └── App.tsx     # Main application entry point
    ├── public/         # Static assets and icons
    ├── package.json    # Frontend dependencies and scripts
    └── vite.config.ts  # Vite configuration
```

---

## 🚀 Detailed Description

### How it Works
ChainMind operates on a "Sense-Think-Act" loop. It **Senses** the current state of the supply chain by ingestging real-time inventory and demand data. It **Thinks** by using ML-based forecasting and multi-agent reasoning to identify risks and opportunities. Finally, it **Acts** by generating procurement recommendations and executive reports autonomously.

### Key Features
- **Multi-Industry Pre-configurations**: Tailored logic for Pharma (shelf-life), FMCG (velocity), Auto Parts (lead-times), and Retail (seasonality).
- **Agentic Orchestration**: Uses CrewAI to coordinate Monitor, Forecast, Procurement, and Alert agents.
- **Predictive Analytics**: 30-day demand projections at the SKU level using historical trend analysis.
- **Autonomous Procurement**: Automatic generation of Purchase Orders based on dynamic reorder points.
- **Disruption Simulation**: Live simulation of "Black Swan" events (floods, strikes) to test supply chain resilience.
- **Dual Interface**: A high-performance React frontend for daily ops and an admin-friendly Streamlit dashboard for data exploration.

### Software Workflow
1.  **Data Initialization**: Realistic synthetic data is generated to simulate an active supply chain environment.
2.  **Inventory Scan**: The **Monitor Agent** identifies critical stock-outs and low-inventory warnings.
3.  **Demand Forecasting**: The **Forecast Agent** runs ML models to predict future sales volume.
4.  **Procurement Optimization**: The **Procurement Agent** matches needs with approved suppliers, considering current lead-time disruptions.
5.  **Executive Feedback**: Results are served via REST API to the React UI, highlighting ROI and service level metrics.

### Advantages
- **Operational Efficiency**: Reduces manual inventory reconciliation time by up to 80%.
- **Risk Mitigation**: Proactively identifies supplier disruptions before they impact production.
- **Cost Reduction**: Optimizes reorder quantities to minimize excess stock while maintaining high service levels.
- **Scalable Architecture**: Easily extendable to new industries or additional agent roles.

---
*Built for Capgemini AgentifAI Buildathon 2026*
