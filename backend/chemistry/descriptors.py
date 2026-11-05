"""
Molecular Descriptors Calculator using RDKit.
Calculates strictly defined physicochemical descriptors from an RDKit Mol object.
"""

from typing import Dict, Any, Optional
from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, Lipinski, rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D


class MolecularDescriptorsCalculator:
    """Calculates physicochemical molecular descriptors using RDKit."""

    @staticmethod
    def calculate_descriptors(mol: Chem.Mol) -> Dict[str, Any]:
        """
        Calculate all target molecular descriptors for a sanitized RDKit molecule.

        Parameters:
            mol: Chem.Mol - Valid, sanitized RDKit molecule object.

        Returns:
            Dict containing calculated properties with exact scientific definitions.
        """
        # Molecular formula (e.g. C6H6N2O)
        formula = rdMolDescriptors.CalcMolFormula(mol)

        # Molecular weight (average molecular mass in g/mol)
        mw = round(float(Descriptors.MolWt(mol)), 4)

        # Exact molecular mass (monoisotopic mass in g/mol)
        exact_mass = round(float(Descriptors.ExactMolWt(mol)), 4)

        # RDKit Crippen cLogP (Wildman-Crippen atom-contribution method)
        # Explicitly identified as RDKit Crippen cLogP (NOT SwissADME consensus LogP)
        crippen_clogp = round(float(Crippen.MolLogP(mol)), 4)

        # Topological Polar Surface Area (TPSA in Å²)
        tpsa = round(float(rdMolDescriptors.CalcTPSA(mol)), 4)

        # Hydrogen Bond Donors (Lipinski count)
        hbd = int(Lipinski.NumHDonors(mol))

        # Hydrogen Bond Acceptors (Lipinski count)
        hba = int(Lipinski.NumHAcceptors(mol))

        # Rotatable bonds count
        rotatable_bonds = int(Lipinski.NumRotatableBonds(mol))

        # Molar Refractivity (Crippen method, in cm³/mol)
        molar_refractivity = round(float(Crippen.MolMR(mol)), 4)

        # Heavy atom count (non-hydrogen atoms)
        heavy_atom_count = int(Lipinski.HeavyAtomCount(mol))

        # Total atom count including implicit hydrogens
        mol_with_hs = Chem.AddHs(mol)
        total_atom_count = int(mol_with_hs.GetNumAtoms())

        return {
            "molecular_formula": formula,
            "molecular_weight": mw,
            "exact_mass": exact_mass,
            "rdkit_crippen_clogp": crippen_clogp,
            "tpsa": tpsa,
            "hbd": hbd,
            "hba": hba,
            "rotatable_bonds": rotatable_bonds,
            "molar_refractivity": molar_refractivity,
            "heavy_atom_count": heavy_atom_count,
            "total_atom_count": total_atom_count,
        }

    @staticmethod
    def generate_svg_depiction(mol: Chem.Mol, width: int = 320, height: int = 240) -> Optional[str]:
        """
        Generate a clean 2D vector SVG representation of the molecule for UI display.
        """
        try:
            drawer = rdMolDraw2D.MolDraw2DSVG(width, height)
            opts = drawer.drawOptions()
            opts.clearBackground = False
            rdMolDraw2D.PrepareAndDrawMolecule(drawer, mol)
            drawer.FinishDrawing()
            svg_text = drawer.GetDrawingText()
            return svg_text
        except Exception:
            return None

