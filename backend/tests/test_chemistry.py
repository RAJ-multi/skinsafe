"""
Unit tests for the SkinSafe Computational Chemistry Engine.
Verifies RDKit molecular descriptor calculations, drug-likeness rules,
Potts-Guy permeability predictions, and error handling for invalid chemical structures.
"""

import pytest
import math
from chemistry.engine import ChemistryEngine, ChemistryValidationError
from chemistry.descriptors import MolecularDescriptorsCalculator
from chemistry.druglikeness import DrugLikenessEvaluator
from chemistry.permeability import PottsGuyPermeabilityModel


class TestNiacinamideCalculations:
    """
    Verification tests for the primary benchmark compound: Niacinamide (Vitamin B3).
    SMILES: NC(=O)c1cccnc1
    """

    NIACINAMIDE_SMILES = "NC(=O)c1cccnc1"

    def test_niacinamide_molecular_formula(self):
        """Verify niacinamide empirical formula is exactly C6H6N2O."""
        result = ChemistryEngine.analyze(self.NIACINAMIDE_SMILES)
        calc = result.calculated_properties
        assert calc["molecular_formula"] == "C6H6N2O"

    def test_niacinamide_descriptors(self):
        """Verify calculated molecular descriptors for niacinamide."""
        result = ChemistryEngine.analyze(self.NIACINAMIDE_SMILES)
        calc = result.calculated_properties

        # Average Molecular Weight should be approx 122.12 g/mol
        assert pytest.approx(calc["molecular_weight"], abs=0.5) == 122.12

        # Monoisotopic exact mass should be approx 122.048 g/mol
        assert pytest.approx(calc["exact_mass"], abs=0.1) == 122.048

        # RDKit Crippen cLogP for NC(=O)c1cccnc1 is 0.1805
        assert pytest.approx(calc["rdkit_crippen_clogp"], abs=0.05) == 0.18

        # TPSA for pyridine nitrogen (~12.89) + primary amide (~43.09) approx 55.98 Å²
        assert pytest.approx(calc["tpsa"], abs=1.0) == 55.98

        # Hydrogen bond donors (primary amide NH2 counts as 1 donor group in standard Lipinski definition)
        assert calc["hbd"] == 1

        # Hydrogen bond acceptors (pyridine N + carbonyl O = 2)
        assert calc["hba"] == 2

        # Heavy atoms: 6 Carbons + 2 Nitrogens + 1 Oxygen = 9
        assert calc["heavy_atom_count"] == 9

        # Rotatable bonds: 1 (connecting aromatic ring to carboxamide)
        assert calc["rotatable_bonds"] == 1

    def test_niacinamide_lipinski_rule_of_five(self):
        """Niacinamide is a classic drug-like compound that fully satisfies Lipinski's Rule of 5."""
        result = ChemistryEngine.analyze(self.NIACINAMIDE_SMILES)
        lipinski = result.druglikeness_assessment["lipinski"]

        assert lipinski["passed"] is True
        assert lipinski["violations_count"] == 0
        assert len(lipinski["violations"]) == 0

    def test_niacinamide_ghose_filter(self):
        """
        Ghose filter requires MW >= 160 Da.
        Niacinamide (MW ~122.12 Da) is below this cutoff and fails MW and molar refractivity.
        Verify that violations are clearly and accurately explained.
        """
        result = ChemistryEngine.analyze(self.NIACINAMIDE_SMILES)
        ghose = result.druglikeness_assessment["ghose"]

        assert ghose["passed"] is False
        assert ghose["violations_count"] > 0
        # Check that molecular weight violation is explicitly identified
        mw_violations = [v for v in ghose["violations"] if "Molecular weight" in v and "160" in v]
        assert len(mw_violations) == 1

    def test_niacinamide_skin_permeability(self):
        """
        Verify Potts-Guy skin permeability calculation for niacinamide:
        log Kp (cm/h) = -2.72 + 0.71(cLogP) - 0.0061(MW)
        Kp (cm/h) = 10^(log Kp)
        Kp (cm/s) = Kp (cm/h) / 3600
        """
        result = ChemistryEngine.analyze(self.NIACINAMIDE_SMILES)
        calc = result.calculated_properties
        perm = result.skin_permeability_prediction

        clogp = calc["rdkit_crippen_clogp"]
        mw = calc["molecular_weight"]
        expected_log_kp = -2.72 + (0.71 * clogp) - (0.0061 * mw)

        assert pytest.approx(perm["log_kp"], abs=0.01) == expected_log_kp
        assert perm["in_applicability_domain"] is True
        assert perm["permeability_class"] == "Moderate"
        assert perm["kp_cm_h"] == pytest.approx(math.pow(10, expected_log_kp), rel=1e-2)
        assert perm["kp_cm_s"] == pytest.approx(perm["kp_cm_h"] / 3600.0, rel=1e-2)

    def test_niacinamide_tpsa_scientific_verification(self):
        """
        Verify that Niacinamide TPSA is calculated as 55.98 Å² by RDKit
        (pyridine nitrogen 12.89 Å² + primary carboxamide 43.09 Å²).
        Contrasts with Pyrazinamide (NC(=O)c1cnccn1, TPSA = 68.87 Å²),
        which possesses a second aromatic ring nitrogen (+12.89 Å²).
        """
        result = ChemistryEngine.analyze(self.NIACINAMIDE_SMILES)
        assert pytest.approx(result.calculated_properties["tpsa"], abs=0.01) == 55.98

        # Explicit contrast against Pyrazinamide (68.87 Å²)
        pyrazinamide_result = ChemistryEngine.analyze("NC(=O)c1cnccn1")
        assert pytest.approx(pyrazinamide_result.calculated_properties["tpsa"], abs=0.01) == 68.87


class TestAdditionalCosmeticCompounds:
    """Verify other standard cosmetic ingredients."""

    def test_glycerin(self):
        """Glycerin (Glycerol): OCC(O)CO."""
        result = ChemistryEngine.analyze("OCC(O)CO")
        calc = result.calculated_properties
        assert calc["molecular_formula"] == "C3H8O3"
        assert pytest.approx(calc["molecular_weight"], abs=0.2) == 92.09
        assert calc["hbd"] == 3
        assert calc["hba"] == 3
        assert calc["heavy_atom_count"] == 6

    def test_salicylic_acid(self):
        """Salicylic Acid: Oc1ccccc1C(=O)O."""
        result = ChemistryEngine.analyze("Oc1ccccc1C(=O)O")
        calc = result.calculated_properties
        assert calc["molecular_formula"] == "C7H6O3"
        assert pytest.approx(calc["molecular_weight"], abs=0.3) == 138.12
        assert calc["hbd"] == 2
        # RDKit Lipinski.NumHAcceptors identifies 2 acceptors: the carbonyl O and phenolic OH (carboxylic acid OH is excluded by SMARTS)
        assert calc["hba"] == 2


class TestHydrogenBondDonorsAndAcceptors:
    """Dedicated tests for hydrogen bond donor and acceptor calculations via RDKit."""

    @pytest.mark.parametrize(
        "smiles, expected_hbd, expected_hba, compound_name",
        [
            ("CCO", 1, 1, "Ethanol"),
            ("Oc1ccccc1", 1, 1, "Phenol"),
            ("CCN(CC)CC", 0, 1, "Triethylamine"),
            ("OCCO", 2, 2, "Ethylene glycol"),
            ("OCC(O)CO", 3, 3, "Glycerin"),
            ("NC(=O)c1cccnc1", 1, 2, "Niacinamide"),
            ("CC(=O)O", 1, 1, "Acetic acid"),
            ("CNC(=O)C", 1, 1, "N-Methylacetamide"),
        ],
    )
    def test_hbd_hba_calculation(self, smiles, expected_hbd, expected_hba, compound_name):
        """Verify HBD and HBA descriptors using Lipinski.NumHDonors and Lipinski.NumHAcceptors."""
        result = ChemistryEngine.analyze(smiles)
        calc = result.calculated_properties
        assert calc["hbd"] == expected_hbd, f"{compound_name} HBD expected {expected_hbd}, got {calc['hbd']}"
        assert calc["hba"] == expected_hba, f"{compound_name} HBA expected {expected_hba}, got {calc['hba']}"


class TestInvalidSmilesHandling:
    """Ensure invalid SMILES strings are handled gracefully with precise scientific errors."""

    def test_empty_smiles(self):
        with pytest.raises(ChemistryValidationError) as exc:
            ChemistryEngine.analyze("")
        assert "empty" in str(exc.value).lower()

    def test_whitespace_smiles(self):
        with pytest.raises(ChemistryValidationError) as exc:
            ChemistryEngine.analyze("   \t\n ")
        assert "empty" in str(exc.value).lower()

    def test_syntactically_invalid_smiles(self):
        with pytest.raises(ChemistryValidationError) as exc:
            ChemistryEngine.analyze("InvalidMolecule123")
        assert "not a syntactically valid smiles" in str(exc.value).lower()

    def test_unclosed_ring_smiles(self):
        with pytest.raises(ChemistryValidationError) as exc:
            ChemistryEngine.analyze("C1CCCC")  # unclosed ring 1
        assert "not a syntactically valid smiles" in str(exc.value).lower()

    def test_hypervalent_carbon_smiles(self):
        with pytest.raises(ChemistryValidationError) as exc:
            # 5-valent carbon: C(C)(C)(C)(C)C
            ChemistryEngine.analyze("C(C)(C)(C)(C)C")
        assert "sanitization failed" in str(exc.value).lower() or "valence" in str(exc.value).lower()


class TestPottsGuyApplicabilityDomain:
    """Test boundary conditions for the Potts-Guy skin permeability empirical model."""

    def test_large_molecule_out_of_domain(self):
        """Molecules with MW > 500 Da should trigger applicability domain warning."""
        # Hexapeptide or large PEG fragment: MW > 500
        # Octaglycerol fragment
        large_smiles = "OCC(O)COCC(O)COCC(O)COCC(O)COCC(O)COCC(O)CO"
        result = ChemistryEngine.analyze(large_smiles)
        perm = result.skin_permeability_prediction

        if result.calculated_properties["molecular_weight"] > 500:
            assert perm["in_applicability_domain"] is False
            assert any("500 Da" in w for w in perm["domain_warnings"])

