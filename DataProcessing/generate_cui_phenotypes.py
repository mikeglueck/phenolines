import sys
import csv
import json
from json import encoder
from TopicManager import TopicManager

### Script to parse cui terms and filter non-phenotype terms

def write_csv(data, filename):
  with open(filename, 'wb') as f:
    w = csv.writer(f)
    w.writerow( ['cui', 'cui_name', 'curated_name', 'hpo', 'hpo_name'] )
    for t in data:
      w.writerow( [t['cui'], t['cui_name'], t['curated_name'], t['hpo'], t['hpo_name']] )
  f.close()

def load_cui_hpo_translations(filename):
  translations = []

  with open(filename, 'rb') as csvfile:
    data = csv.DictReader(csvfile)
    for row in data:
      translations.append(row)
  csvfile.close()

  return translations

def label_phenotypes(term_list):
  phenotypes = []
  nonphenotypes = []

  for i, term in enumerate(term_list):
    isPheno = True
    hasHpo = (len(term['hpo']) > 0)

    # Get CUI name
    name = term['cui_name'].lower()
    term['curated_name'] = ""

    # If no CUI name, skip
    if len(name) == 0:
      continue

    # If no HPO existed in UMLS
    if not hasHpo:
      # Truncate terms
      truncateWords = [
        "with ",
        "without ",
        "arising ",
        " nec ",
      ]

      for w in truncateWords:
        i = name.find(w)
        if i > -1:
          name = name[0:i]

      # Replace curated terms
      replaceWords = {
        "dyslexia and alexia": "dyslexia",
        "symbolic dysfunction": "impaired social interactions",
        "conduct disorder": "oppositional defiant disorder",
        "bipolar i disorder": "bipolar disorder",
        "developmental speech": "delayed speech",
        "mixed development disorder": "neurodevelopmental delay",
        "behavioral insomnia": "insomnia",
        "paranoid states": "paranoia",
        "paranoid state": "paranoia",
        "anxiety states": "anxiety",
        "anxiety state": "anxiety",
        "infantile autism": "autism",
        "manic disorder": "mania",
        "mood disorder": "depression",
        "emotional distress": "emotional lability",
        "mental depression": "depression",
        "mental suffering": "emotion/affect behavior",
        "abstract thought disorder": "psychosis",
        "bullying": "aggressive behavior",
        "asperger syndrome": "autism",
        "forgetting": "forgetfulness",
        "nightmares": "sleep disturbance",
        "obsessions": "obsessive-compulsive behavior",
        "phobic anxiety disorder": "anxiety",
        "staring": "behavioral abnormality",
        "respiratory distress syndrome": "respiratory distress",
        "dermatitis verrucosa": "dermatitis",
        "overanxious disorder": "anxiety",
        "wasting": "cachexia",
        "developmental coordination disorder": "motor delay",
        "mixed receptive-expressive language disorder": "language delay",
        "acute upper respiratory infection": "acute respiratory tract infection",
        "muscle, ligament and fascia disorders": "muscle abnormality",
        "croup": "abnormality of the vocal cords",
        "tendon contracture": "contracture",
        "redundant prepuce and phimosis": "abnormality of the preputium",
        "common variable immunodeficiency": "immunodeficiency",
        "neurologic neglect syndrome": "abnormality of the nervous system",
        "other specified congenital malformations": "phenotypic abnormality",
        "other and unspecified noninfectious gastroenteritis and colitis": "gastrointestinal inflammation",
        "precocious sexual development and puberty": "precocious puberty",
        "developmental expressive language disorder": "expressive language delay",
        "congenital insufficiency of mitral valve": "insufficiency of mitral valve",
        "hypertrophy of adenoids": "abnormal size nasopharyngeal adenoids",
        "extreme immaturity, unspecified {weight}": "premature birth",
        "other congenital malformations of lower limb(s), including pelvic girdle": "abnormality lower limbs",
        "congenital musculoskeletal deformities of skull, face, and jaw": "abnormality of the head",
        "adult onset fluency disorder": "stuttering",



        "morbid": "",

        "manic, ": "",
        "depressed, ": "",
        "most recent episode (or current)": "",
        "single episode": "",
        "current episode": "",
        "unspecified as to episode of care": "",

        "not applicable": "",
        "in partial or unspecified remission": "",
        "not stated as uncontrolled": "",
        "without mention of complication": "",

        "arising from mental factors": "",
        "current or active state": "",
        "chronic state with acute exacerbation": "",
        "residual state": "",
        "subchronic state": "",
        "unspecified state": "",
        "unspecified childhood": "",
        "simple or unspecified": "",
        "organism unspecified": "",
        "other specified": "",
        "unspecified affecting unspecified side": "",

        "specific to childhood and adolescence": "",
        "of childhood or adolescence": "",
        "other or ": "",
        "schizo-affective type": "",
        "severe degree": "",
        "other": "",
        "localization-related": "",
        "infantile": "",
        "childhood": "",
        "adult": "",
        "episodic": "",
        "idiopathic": "",
        "unspecified": "",
        "partial": "",


      }

      for w, v in replaceWords.iteritems():
        if name.find(w) > -1:
          name = name.replace(w, v)

      term['curated_name'] = name  # save new version



      # Filter terms with words likely to not be phenotypes
      filterWords = [
        #"drug",
        "accident",
        "poison",
        "foreign body",
        "studies",
        "examination",
        "encounter",
        "observation",
        "operation",
        "surgery",
        "therapeutic",
        "therapy",
        "medication",
        "vaccination",
        "inoculation",
        "immunization",
        "device",
        "implant",
        "fitting and adjustment",
        #"complication",  # <-- too broad?
        "medical care",
        "receiving care",
        "status",
        "procedure",
        "procedural",
        "reaction",
        "adverse effect",
        "late effect",
        "toxic effect",
        #"injury",
        "contusion",
        "closed fracture",
        "open fracture",
        "wound",
        "concussion",
        "sprain",
        "burn",
        "history",
        "gestation",
        "pregnant",
        "counseling",
        "screening",
        "down syndrome",
        "common cold",
        #"simian acquired immunodeficiency syndrome",  # These do not map to anything
        #"siti", # These do not map to anything
        "measles",
        "general symptom",


      ]

      for w in filterWords:
        if name.find(w) > -1:
          isPheno = False
          break

    if isPheno:
      phenotypes.append(term)
    else:
      nonphenotypes.append(term)


  return (phenotypes, nonphenotypes)


datasets = [
  '_20170227',
  '_20170228',
  '_20170322',
]

if __name__ == '__main__':
  for dataset in datasets:
    print 'Processing', dataset

    # Load CUI -> HPO Map
    source_translations = './data/umls_terms/cui-hpo-translations%s.csv' % dataset
    translations = load_cui_hpo_translations(source_translations)

    # Get filtered phenotypes
    phenotypes, nonphenotypes = label_phenotypes(translations)

    # Save as csv
    write_csv(phenotypes, './data/cui_phenotypes/cui-phenotypes%s.csv' % dataset)
    write_csv(nonphenotypes, './data/cui_phenotypes/cui-non-phenotypes%s.csv' % dataset)

  print 'Exported filtered phenotype lists'

  sys.exit()
