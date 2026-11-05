# SkinSafe

**SkinSafe** is a computational cosmetic ingredient and skin permeability analysis platform. It empowers cosmetic scientists, formulation researchers, students, and skincare users to analyze cosmetic compounds, compute molecular descriptors, evaluate drug-likeness rules, and predict transdermal skin permeability using scientifically validated models.

---

## Key Features

- **Molecular Descriptors Engine**: Calculates molecular formula, average and exact molecular weight, RDKit Crippen cLogP, TPSA, HBD, HBA, rotatable bonds, molar refractivity, and heavy atom counts directly from SMILES structures.
- **Drug-Likeness Assessments**: Evaluates Lipinski's Rule of 5 and the Ghose filter, returning comprehensive rule breakdowns and actionable violation descriptions.
- **Skin Permeability Prediction (Potts–Guy Model)**: Estimates the steady-state transdermal permeability coefficient ($\log K_p$ and $K_p$ in $\text{cm/s}$) based on the Potts–Guy empirical equation.
- **Scientific Integrity**: Rigorous distinction between strictly calculated molecular properties and statistical model predictions. Clear applicability domains and disclaimers regarding drug-likeness vs. cosmetic safety.
- **Modern Responsive Interface**: Built with Next.js, React, TypeScript, and Tailwind CSS with a clean, clinical aesthetic.

---

## Architecture Overview

```
skinsafe/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api.py           # FastAPI REST API endpoints
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── main.py          # FastAPI application entrypoint
│   ├── chemistry/
│   │   ├── __init__.py
│   │   ├── descriptors.py   # RDKit molecular descriptors calculation
│   │   ├── druglikeness.py  # Lipinski and Ghose rule assessments
│   │   ├── permeability.py  # Potts–Guy skin permeability model
│   │   └── engine.py        # Unified computational chemistry orchestrator
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_chemistry.py # Unit tests for calculations & edge cases
│   │   └── test_api.py       # API integration tests
│   ├── requirements.txt
│   └── .venv/
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # UI cards, tables, badges, and forms
│   │   ├── lib/             # API client, types, and utilities
│   │   └── styles/          # Global CSS & Tailwind styling
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── scientific-methodology.md # Scientific references, equations, and limits
├── README.md
├── .gitignore
└── .env.example
```

---

## Getting Started

### Prerequisites

- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: v18+ or v20+ (tested on v26)
- **npm**: 10+ (tested on npm 12)

### Backend Setup

1. Navigate to the backend directory and activate the virtual environment:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run unit and integration tests:
   ```bash
   pytest
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be available at `http://localhost:8000`.
   Interactive Swagger documentation is at `http://localhost:8000/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## API Documentation

### `POST /api/v1/analyze`
Submits a SMILES string for computational chemistry and permeability analysis.

**Request Body**:
```json
{
  "smiles": "NC(=O)c1cccnc1"
}
```

**Response Format**:
```json
{
  "smiles": "NC(=O)c1cccnc1",
  "canonical_smiles": "NC(=O)c1cccnc1",
  "calculated_properties": {
    "molecular_formula": "C6H6N2O",
    "molecular_weight": 122.13,
    "exact_mass": 122.048,
    "rdkit_crippen_clogp": 0.18,
    "tpsa": 55.98,
    "hbd": 1,
    "hba": 2,
    "rotatable_bonds": 1,
    "molar_refractivity": 32.75,
    "heavy_atom_count": 9
  },
  "druglikeness_assessment": {
    "lipinski": {
      "passed": true,
      "violations_count": 0,
      "violations": []
    },
    "ghose": {
      "passed": false,
      "violations_count": 2,
      "violations": ["Molecular weight 122.13 is below 160", "Molar refractivity 32.75 is below 40"]
    },
    "scientific_disclaimer": "Drug-likeness filters assess oral drug absorption parameters and do not indicate cosmetic safety or hypoallergenic tolerability."
  },
  "skin_permeability_prediction": {
    "model_name": "Potts-Guy Empirical Equation (1992)",
    "log_kp": -3.34,
    "kp_cm_h": 4.60e-4,
    "kp_cm_s": 1.28e-7,
    "permeability_class": "Moderate",
    "equation": "log Kp (cm/h) = -2.72 + 0.71(cLogP) - 0.0061(MW)",
    "prediction_disclaimer": "Model-derived estimation of passive diffusion through human stratum corneum in aqueous vehicle. Does not account for cosmetic vehicles, pH, formulation enhancements, or in vivo clearance."
  }
}
```

### `POST /api/v1/compare`
Analyzes multiple cosmetic compounds (minimum 2) side by side for comparative evaluation.

**Request Body**:
```json
{
  "compounds": [
    { "name": "Niacinamide", "smiles": "NC(=O)c1cccnc1" },
    { "name": "Salicylic Acid", "smiles": "Oc1ccccc1C(=O)O" }
  ]
}
```

**Response Format**:
```json
{
  "compounds": [
    {
      "name": "Niacinamide",
      "input_smiles": "NC(=O)c1cccnc1",
      "canonical_smiles": "NC(=O)c1cccnc1",
      "calculated_properties": { ... },
      "druglikeness_assessment": { ... },
      "skin_permeability_prediction": { ... }
    },
    {
      "name": "Salicylic Acid",
      "input_smiles": "Oc1ccccc1C(=O)O",
      "canonical_smiles": "O=C(O)c1ccccc1O",
      "calculated_properties": { ... },
      "druglikeness_assessment": { ... },
      "skin_permeability_prediction": { ... }
    }
  ],
  "comparison_count": 2
}
```

### `GET /api/v1/health`
Health check endpoint reporting backend and RDKit operational status.

---

## Scientific Methodology & Disclaimers

For full mathematical descriptions, derivations, references, and parameter boundaries, refer to [`docs/scientific-methodology.md`](docs/scientific-methodology.md).

- **Crippen cLogP vs Consensus LogP**: SkinSafe calculates RDKit Crippen cLogP (Wildman & Crippen, 1999) rather than SwissADME consensus LogP.
- **Drug-likeness vs Safety**: Lipinski and Ghose rules model small-molecule oral druggability, not topical safety or skin irritation.
- **Empirical Permeability**: The Potts–Guy equation is an empirical linear regression model ($n \approx 90$ compounds). It is a model prediction and should never be conflated with laboratory-measured transdermal flux.

