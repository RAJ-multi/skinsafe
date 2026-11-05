# SkinSafe Scientific Methodology & Calculation Documentation

## 1. Overview & Scientific Integrity

SkinSafe is an open computational chemistry platform designed to evaluate molecular descriptors, drug-likeness rules, and skin permeability for cosmetic ingredients and chemical compounds. 

In computational chemistry and cosmetic safety assessments, transparency and reproducibility are vital. SkinSafe enforces strict scientific categorization across all outputs:
- **Calculated Properties**: Rigorously computed from molecular topology, 2D structure, and connectivity tables using established cheminformatics algorithms (RDKit).
- **Model Predictions**: Empirical and statistical QSPR (Quantitative Structure-Property Relationship) models (e.g., the Potts–Guy permeability equation) derived from experimental training sets. Predictions carry inherent variance and applicability domains.
- **Database Values**: Experimentally verified values retrieved from validated repositories (reserved for future PubChem integration).

> **Important Safety Notice**: Drug-likeness criteria (such as Lipinski's Rule of 5 or the Ghose filter) assess oral drug absorption and bioavailability characteristics. **Passing drug-likeness filters does not indicate cosmetic safety, non-toxicity, hypoallergenic properties, or non-irritancy.**

---

## 2. Molecular Descriptors (RDKit Implementation)

All molecular representations are parsed from standard Simplified Molecular Input Line Entry System (SMILES) notation into sanitized molecular graphs using the RDKit cheminformatics toolkit.

| Descriptor | Method / RDKit Function | Scientific Definition & Unit |
| :--- | :--- | :--- |
| **Molecular Formula** | `Chem.rdMolDescriptors.CalcMolFormula` | Hill-system empirical chemical formula representing elemental composition. |
| **Average Molecular Weight ($MW$)** | `Descriptors.MolWt` | Sum of standard atomic weights of all constituent atoms ($\text{g/mol}$ or $\text{Da}$). Used in Potts–Guy equation. |
| **Exact Molecular Mass** | `Descriptors.ExactMolWt` | Monoisotopic mass calculated using most abundant isotopes ($\text{g/mol}$ or $\text{Da}$). |
| **RDKit Crippen cLogP** | `Crippen.MolLogP` | 1-octanol/water partition coefficient calculated via the Wildman & Crippen atom-additive method. |
| **Topological Polar Surface Area (TPSA)** | `rdMolDescriptors.CalcTPSA` | Sum of polar atomic surfaces (oxygen, nitrogen, and attached hydrogens) in $\text{Å}^2$ using the Ertl et al. fragment-based methodology. |
| **Hydrogen Bond Donors (HBD)** | `Lipinski.NumHBD` | Number of hydrogen bond donors ($\text{OH}$ and $\text{NH}$ groups). |
| **Hydrogen Bond Acceptors (HBA)** | `Lipinski.NumHBA` | Number of hydrogen bond acceptors (nitrogen and oxygen atoms). |
| **Rotatable Bonds** | `Lipinski.NumRotatableBonds` | Number of single non-ring bonds bounded to non-terminal heavy atoms, indicating conformational flexibility. |
| **Molar Refractivity ($MR$)** | `Crippen.MolMR` | Measure of the total polarizability of a mole of the compound ($\text{cm}^3/\text{mol}$) calculated via the Crippen atomic contribution model. |
| **Heavy Atom Count** | `Lipinski.HeavyAtomCount` | Total number of non-hydrogen atoms. |

### Note on RDKit Crippen cLogP vs SwissADME Consensus LogP
SkinSafe calculates **RDKit Crippen cLogP** based on Wildman and Crippen's 1999 atomic contribution method. This value is distinct from the **SwissADME Consensus LogP**, which is an arithmetic average of five distinct predictive methods:
1. **XLOGP3** (atomistic with correction factors)
2. **WLOGP** (Wildman & Crippen atom-based)
3. **MLOGP** (Moriguchi topological method)
4. **SILICOS-IT** (hybrid fragmental/topological)
5. **iLOGP** (implicit solvent solvation free energy)

SkinSafe reports Crippen cLogP with clear scientific provenance and avoids conflation with multi-model consensus benchmarks.

### Note on Topological Polar Surface Area (TPSA)
TPSA is calculated via RDKit using the fragmental contribution algorithm of Ertl, Rohde, and Selzer (2000). For **Niacinamide** (pyridine-3-carboxamide, `NC(=O)c1cccnc1`), polar surface contributions consist of:
- Aromatic pyridine nitrogen: $12.89\text{ \AA}^2$
- Primary carboxamide group ($\text{–C(=O)NH}_2$): $43.09\text{ \AA}^2$
- **Total Niacinamide TPSA**: $12.89 + 43.09 = 55.98\text{ \AA}^2$

*(Note: Pyrazinamide, `NC(=O)c1cnccn1`, which possesses two aromatic pyrazine nitrogens, evaluates to $43.09 + 2 \times 12.89 = 68.87\text{ \AA}^2$. Niacinamide's single ring nitrogen accounts for the exact $55.98\text{ \AA}^2$ result).*

---

## 3. Drug-Likeness & Bioavailability Rules

### Lipinski's Rule of Five (Ro5)
Formulated by Christopher A. Lipinski in 1997 to predict whether a compound has chemical and physical properties likely to confer oral bioavailability:
- **Molecular Weight ($MW$)**: $\le 500\text{ g/mol}$
- **Calculated LogP ($\text{cLogP}$)**: $\le 5.0$
- **Hydrogen Bond Donors ($\text{HBD}$)**: $\le 5$
- **Hydrogen Bond Acceptors ($\text{HBA}$)**: $\le 10$

**Evaluation**: A compound passes Lipinski's rule if it has $\le 1$ violation. SkinSafe reports all individual violations with specific threshold comparisons.

### Ghose Filter
Formulated by Ghose, Viswanadhan, and Wendoloski (1999) to establish drug-like chemical property profiles based on comprehensive database analyses:
- **Molecular Weight ($MW$)**: $160 \le MW \le 480\text{ g/mol}$
- **Molar Refractivity ($MR$)**: $40 \le MR \le 130$
- **Calculated LogP ($\text{cLogP}$)**: $-0.4 \le \text{cLogP} \le 5.6$
- **Total Atom Count**: $20 \le \text{Atom Count} \le 70$

SkinSafe checks each boundary individually and reports explicit reasons for any non-compliance.

---

## 4. Skin Permeability Prediction (Potts–Guy Model)

### Model Formulation
To estimate passive transdermal diffusion across the human stratum corneum, SkinSafe implements the empirical linear free-energy relationship developed by Potts and Guy (1992):

$$\log K_p = -2.72 + 0.71(\text{cLogP}) - 0.0061(MW)$$

Where:
- $\text{cLogP}$ is the RDKit Crippen partition coefficient.
- $MW$ is the average molecular weight in $\text{g/mol}$.
- $\log K_p$ is the common logarithm (base 10) of the predicted permeability coefficient ($K_p$) in **$\text{cm/h}$**, directly reflecting the empirical baseline from Flynn's (1990) stratum corneum compilation.
- Permeability coefficient $K_p (\text{cm/h}) = 10^{\log K_p}$.
- Transdermal permeability in $\text{cm/s} = \frac{K_p (\text{cm/h})}{3600}$.
- Equivalent base-10 logarithm in $\text{cm/s}$: $\log K_p (\text{cm/s}) = \log K_p (\text{cm/h}) - \log_{10}(3600) = \log K_p (\text{cm/h}) - 3.5563$.

### Permeability Categorization
Based on transdermal literature standards evaluated on the native $\text{cm/h}$ scale:
- **High Permeability**: $\log K_p (\text{cm/h}) \ge -2.0$ ($K_p \ge 10^{-2}\text{ cm/h}$; small, lipophilic solutes that cross the stratum corneum lipid bilayer rapidly)
- **Moderate Permeability**: $-4.0 \le \log K_p (\text{cm/h}) < -2.0$ ($10^{-4} \le K_p < 10^{-2}\text{ cm/h}$; intermediate permeants under passive aqueous conditions)
- **Low Permeability**: $\log K_p (\text{cm/h}) < -4.0$ ($K_p < 10^{-4}\text{ cm/h}$; large or strongly hydrophilic solutes with slow stratum corneum passage)

### Scientific Limitations of the Potts–Guy Model
1. **Stratum Corneum Barrier Only**: The model estimates passive diffusion across the lipid matrix of in vitro human or mammalian stratum corneum from aqueous solution.
2. **Applicability Domain**: Developed primarily for uncharged, small non-electrolyte organic molecules ($MW < 500\text{ g/mol}$ and $-1 < \text{cLogP} < 4$). Ionized species at physiological skin pH (~4.5–5.5) have significantly altered permeability not captured by simple non-ionized cLogP.
3. **Absence of Formulation Effects**: The model assumes an aqueous vehicle. It cannot account for cosmetic formulations (emulsions, lipid nanoparticles, surfactants, alcohol vehicles, penetration enhancers like propylene glycol or oleic acid).
4. **No Viable Epidermal Clearance or Metabolism**: Does not simulate enzymatic degradation (e.g. esterases) or microvascular clearance in the dermis.
5. **Model Prediction vs. Measurement**: All output values are statistical estimates and must not be cited as measured in vitro or in vivo permeability.

---

## 5. Scope Boundaries & Future Implementations

The current version of SkinSafe explicitly **omits**:
- Gastrointestinal (GI) absorption predictions (e.g., Egan or boiled-egg models)
- Blood-Brain Barrier (BBB) penetration models
- Cytochrome P450 (CYP) enzyme inhibition predictions
- P-glycoprotein (P-gp) substrate/inhibition predictions
- Toxicity, phototoxicity, and contact allergy predictions

These modules require specialized, benchmarked machine learning or QSAR models and will be incorporated only after rigorous scientific validation.

---

## 6. References

1. **Potts, R. O., & Guy, R. H.** (1992). Predicting skin permeability via a simple equation. *Pharmaceutical Research*, 9(5), 663–669.
2. **Lipinski, C. A., Lombardo, F., Dominy, B. W., & Feeney, P. J.** (1997). Experimental and computational approaches to estimate solubility and permeability in drug discovery and development settings. *Advanced Drug Delivery Reviews*, 23(1-3), 3–25.
3. **Ghose, A. K., Viswanadhan, V. N., & Wendoloski, J. J.** (1999). A knowledge-based approach in designing combinatorial or medicinal chemistry libraries for drug discovery. 1. Qualifying active compounds for small-molecule pharmaceutical libraries. *Journal of Combinatorial Chemistry*, 1(1), 55–68.
4. **Wildman, S. A., & Crippen, G. M.** (1999). Prediction of Physicochemical Parameters by Atomic Contributions. *Journal of Chemical Information and Computer Sciences*, 39(5), 868–873.
5. **Ertl, P., Rohde, B., & Selzer, P.** (2000). Fast calculation of molecular polar surface area as a sum of fragment-based contributions and its application to the prediction of drug transport properties. *Journal of Medicinal Chemistry*, 43(20), 3714–3717.
6. **Daina, A., Michielin, O., & Zoete, V.** (2017). SwissADME: a free web tool to evaluate pharmacokinetics, drug-likeness and medicinal chemistry friendliness of small molecules. *Scientific Reports*, 7, 42717.

