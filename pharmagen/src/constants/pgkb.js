/**
 * Pharmacogenomics Knowledge Base
 * Curated variant database covering 6 critical genes:
 * CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
 */

export const KNOWN_VARIANTS = {
  // ── CYP2D6 ──────────────────────────────────────────────────────────────────
  rs3892097:  { gene: 'CYP2D6',   star: '*4',        effect: 'loss_of_function',        phenotype_impact: -1    },
  rs35742686: { gene: 'CYP2D6',   star: '*3',        effect: 'loss_of_function',        phenotype_impact: -1    },
  rs5030655:  { gene: 'CYP2D6',   star: '*6',        effect: 'loss_of_function',        phenotype_impact: -1    },
  rs16947:    { gene: 'CYP2D6',   star: '*2',        effect: 'normal',                  phenotype_impact:  0    },
  rs28371706: { gene: 'CYP2D6',   star: '*41',       effect: 'decreased',               phenotype_impact: -0.5  },
  rs1135840:  { gene: 'CYP2D6',   star: '*10',       effect: 'decreased',               phenotype_impact: -0.5  },

  // ── CYP2C19 ─────────────────────────────────────────────────────────────────
  rs4244285:  { gene: 'CYP2C19',  star: '*2',        effect: 'loss_of_function',        phenotype_impact: -1    },
  rs4986893:  { gene: 'CYP2C19',  star: '*3',        effect: 'loss_of_function',        phenotype_impact: -1    },
  rs12248560: { gene: 'CYP2C19',  star: '*17',       effect: 'increased',               phenotype_impact: +1    },
  rs28399504: { gene: 'CYP2C19',  star: '*4',        effect: 'loss_of_function',        phenotype_impact: -1    },

  // ── CYP2C9 ──────────────────────────────────────────────────────────────────
  rs1799853:  { gene: 'CYP2C9',   star: '*2',        effect: 'decreased',               phenotype_impact: -0.5  },
  rs1057910:  { gene: 'CYP2C9',   star: '*3',        effect: 'significantly_decreased', phenotype_impact: -1    },
  rs28371686: { gene: 'CYP2C9',   star: '*5',        effect: 'decreased',               phenotype_impact: -0.75 },

  // ── SLCO1B1 ─────────────────────────────────────────────────────────────────
  rs4149056:  { gene: 'SLCO1B1',  star: '*5',        effect: 'decreased_transport',     phenotype_impact: -1    },
  rs2306283:  { gene: 'SLCO1B1',  star: '*1B',       effect: 'increased_transport',     phenotype_impact: +0.5  },

  // ── TPMT ────────────────────────────────────────────────────────────────────
  rs1800462:  { gene: 'TPMT',     star: '*2',        effect: 'loss_of_function',        phenotype_impact: -1    },
  rs1800460:  { gene: 'TPMT',     star: '*3B',       effect: 'loss_of_function',        phenotype_impact: -1    },
  rs1142345:  { gene: 'TPMT',     star: '*3C',       effect: 'loss_of_function',        phenotype_impact: -1    },

  // ── DPYD ────────────────────────────────────────────────────────────────────
  rs3918290:  { gene: 'DPYD',     star: '*2A',       effect: 'loss_of_function',        phenotype_impact: -1    },
  rs55886062: { gene: 'DPYD',     star: '*13',       effect: 'loss_of_function',        phenotype_impact: -1    },
  rs67376798: { gene: 'DPYD',     star: 'c.2846A>T', effect: 'decreased',              phenotype_impact: -0.5  },
}

/**
 * Maps each supported drug to its primary PGx gene and metabolic mechanism.
 */
export const DRUG_GENE_MAP = {
  CODEINE:        { gene: 'CYP2D6',  mechanism: 'prodrug activation to morphine via O-demethylation' },
  WARFARIN:       { gene: 'CYP2C9',  mechanism: 'hepatic metabolism and S-warfarin clearance' },
  CLOPIDOGREL:    { gene: 'CYP2C19', mechanism: 'prodrug activation to active thienopyridine metabolite' },
  SIMVASTATIN:    { gene: 'SLCO1B1', mechanism: 'hepatic uptake transport via OATP1B1 transporter' },
  AZATHIOPRINE:   { gene: 'TPMT',    mechanism: 'thiopurine methylation and inactivation' },
  FLUOROURACIL:   { gene: 'DPYD',    mechanism: 'pyrimidine catabolism and 5-FU inactivation' },
  
  // New Additions
  OMEPRAZOLE:     { gene: 'CYP2C19', mechanism: 'Metabolism variability and clearance' },
  AMITRIPTYLINE:  { gene: 'CYP2D6',  mechanism: 'Dose adjustment and metabolism' },
  PHENYTOIN:      { gene: 'CYP2C9',  mechanism: 'Toxicity risk and hepatic clearance' },
  ATORVASTATIN:   { gene: 'SLCO1B1', mechanism: 'Myopathy risk via OATP1B1 transport' },
  MERCAPTOPURINE: { gene: 'TPMT',    mechanism: 'Severe toxicity via thiopurine methylation' },
  CAPECITABINE:   { gene: 'DPYD',    mechanism: 'Fluoropyrimidine toxicity and catabolism' },
}
/**
 * Risk labels for each drug × phenotype combination,
 * based on CPIC guideline recommendations.
 */
export const DRUG_PHENOTYPE_RISKS = {
  CODEINE: {
    PM:  'Ineffective',
    IM:  'Adjust Dosage',
    NM:  'Safe',
    RM:  'Safe',
    URM: 'Toxic',
  },
  WARFARIN: {
    PM:  'Toxic',
    IM:  'Adjust Dosage',
    NM:  'Safe',
    RM:  'Safe',
    URM: 'Adjust Dosage',
  },
  CLOPIDOGREL: {
    PM:  'Ineffective',
    IM:  'Ineffective',
    NM:  'Safe',
    RM:  'Safe',
    URM: 'Adjust Dosage',
  },
  SIMVASTATIN: {
    PM:  'Toxic',
    IM:  'Adjust Dosage',
    NM:  'Safe',
    RM:  'Safe',
    URM: 'Safe',
  },
  AZATHIOPRINE: {
    PM:  'Toxic',
    IM:  'Adjust Dosage',
    NM:  'Safe',
    RM:  'Safe',
    URM: 'Adjust Dosage',
  },
  FLUOROURACIL: {
    PM:  'Toxic',
    IM:  'Adjust Dosage',
    NM:  'Safe',
    RM:  'Safe',
    URM: 'Adjust Dosage',
  },
  OMEPRAZOLE: { 
    PM: 'Safe', IM: 'Safe', NM: 'Safe', RM: 'Ineffective', URM: 'Ineffective' 
  },
  AMITRIPTYLINE: { 
    PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Adjust Dosage', URM: 'Ineffective' 
  },
  PHENYTOIN: { 
    PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Safe' 
  },
  ATORVASTATIN: { 
    PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Safe' 
  },
  MERCAPTOPURINE: { 
    PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Adjust Dosage' 
  },
  CAPECITABINE: { 
    PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Adjust Dosage' 
  },
}

export const SEVERITY_MAP = {
  'Safe':          'none',
  'Adjust Dosage': 'moderate',
  'Toxic':         'critical',
  'Ineffective':   'high',
  'Unknown':       'low',
}

export const CONFIDENCE_MAP = {
  'Safe':          0.92,
  'Adjust Dosage': 0.85,
  'Toxic':         0.90,
  'Ineffective':   0.88,
  'Unknown':       0.40,
}

export const PHENOTYPE_LABELS = {
  PM:      'Poor Metabolizer',
  IM:      'Intermediate Metabolizer',
  NM:      'Normal Metabolizer',
  RM:      'Rapid Metabolizer',
  URM:     'Ultrarapid Metabolizer',
  Unknown: 'Unknown',
}

export const RISK_STYLES = {
  'Safe':          { color: '#00d4a0', bg: 'rgba(0,212,160,0.10)',  label: 'SAFE'          },
  'Adjust Dosage': { color: '#f5a623', bg: 'rgba(245,166,35,0.10)', label: 'ADJUST DOSAGE' },
  'Toxic':         { color: '#ff4757', bg: 'rgba(255,71,87,0.10)',  label: 'TOXIC'         },
  'Ineffective':   { color: '#a855f7', bg: 'rgba(168,85,247,0.10)', label: 'INEFFECTIVE'   },
  'Unknown':       { color: '#8899aa', bg: 'rgba(136,153,170,0.10)', label: 'UNKNOWN'      },
}

export const SAMPLE_VCF = `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="RS number">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tPATIENT_DEMO01
chr22\t42522613\trs3892097\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*4;RS=3892097\tGT\t0/1
chr10\t96521657\trs4244285\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*2;RS=4244285\tGT\t1/1
chr10\t96702047\trs1799853\tC\tT\t100\tPASS\tGENE=CYP2C9;STAR=*2;RS=1799853\tGT\t0/1
chr12\t21331549\trs4149056\tT\tC\t100\tPASS\tGENE=SLCO1B1;STAR=*5;RS=4149056\tGT\t0/1
chr6\t18128556\trs1800462\tC\tG\t100\tPASS\tGENE=TPMT;STAR=*2;RS=1800462\tGT\t0/1
chr1\t97915614\trs3918290\tC\tT\t100\tPASS\tGENE=DPYD;STAR=*2A;RS=3918290\tGT\t0/1`

export const SAMPLE_DRUGS = 'CODEINE, WARFARIN, CLOPIDOGREL, SIMVASTATIN, AZATHIOPRINE, FLUOROURACIL'
