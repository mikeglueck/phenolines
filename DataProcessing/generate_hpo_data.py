import sys
import csv
import json
from json import encoder
from TopicManager import TopicManager

### Script to export HPO data from CUI source using CUI -> HPO map
# - Read in CUI -> HPO Map
# - Create HPO Subgraphs of terms
# - Output JSON of HPO terms for patients in cohorts of diseases


# Format JSON float output
encoder.FLOAT_REPR = lambda o: format(o, '.10f')
json_indent = None
json_separators = (',', ':')

pretty_json = False

if pretty_json:
    json_indent = 2
    json_separators = (',', ': ')


def write_json(data, filename):
  with open(filename, 'wb') as f:
    w = json.dumps(data, sort_keys=True, indent=json_indent, separators=json_separators)
    f.write(w)
  f.close()  


def export_hpos(topics, hpo_map):
  # HACKY approach to generating input to PhenoBackend.
  # Consider topic->disease, time->patient, prob as HPO attr
  def disease_struct():
    return {
      "disease": {
        "omim_id": None,
        "name": "",
        "abbr": ""
        },
      "cohorts": []
      }
  def cohort_struct():
    return {
      "id": "",
      "name": "",
      "patients": []
      }
  def patient_struct():
    return {
      "id": "",
      "absent": [],
      "present": [],
      "attr": {}
      }

  diseases = []

  for topic in sorted(topics.topics.values(), key=lambda x: float(x.id)):
    #print topic.id
    d = disease_struct()
    d['disease']['abbr'] = 'T%02d' % int(topic.id)
    d['disease']['name'] = 'Topic %02d' % int(topic.id)
    diseases.append(d)

    c = cohort_struct()
    c['id'] = 'C1'
    c['name'] = 'Cohort 1'
    d['cohorts'].append(c)

    for time in sorted(topic.times.values(), key=lambda x: float(x.id)):
      #print '  ', time.id
      p = patient_struct()
      p['id'] = 'P%02d' % int(time.id)
      c['patients'].append(p)

      # Aggregate prob when multiple CUIs map to an HPO
      hpoRecs = {}

      for word in sorted(time.words.values(), key=lambda x: x.id):
        # Only map terms if a mapping exists
        if word.id in hpo_map:
          hpoId = hpo_map[word.id]

          # create new record if HPO does not exist, otherwise add to existing record
          if not hpoId in hpoRecs:
            hpoRecs[hpoId] = {
              'id': hpo_map[word.id],
              'modifiers': [],
              'attr': {'cui': [], 'prob': 0.0}
              }

          hpoRecs[hpoId]['attr']['cui'].append(word.id)
          hpoRecs[hpoId]['attr']['prob'] += word.prob

          #print '    ', word.id, word.prob, hpo_map[word.id]
          # p['present'].append({
          #   'id': hpo_map[word.id],
          #   'modifiers': [],
          #   'attr': {'cui': word.id, 'prob': word.prob}
          #   })

      p['present'] = hpoRecs.values()

  return {
    'topics': diseases
    }

def load_cui_hpo_translations(filename):
  translations = []

  with open(filename, 'rb') as csvfile:
    data = csv.DictReader(csvfile)
    for row in data:
      translations.append(row)
  csvfile.close()

  return translations

def get_cui_hpo_map(translations):
  hpomap = dict()

  for t in translations:
      if t['hpo']:
          hpomap[t['cui']] = t['hpo']

  return hpomap

datasets = [
  '_20170227',
  '_20170228',
  '_20170322',
]

if __name__ == '__main__':
  for dataset in datasets:
    print 'Processing', dataset

    # Load CUI -> HPO Map
    source_translations = './data/cui_hpo_map/cui-hpo-map%s.csv' % dataset
    translations = load_cui_hpo_translations(source_translations)

    # Load CUI terms
    source_topics = './data/cui/topics_print%s.csv' % dataset
    topics = TopicManager()
    topics.read_data(source_topics)

    # Get map from hpo to cui
    hpo_map = get_cui_hpo_map(translations)
    diseases = export_hpos(topics, hpo_map)

    # Save as json
    write_json(diseases, './data/hpo/diseases%s.json' % dataset)

  print 'Exported HPO Disease data'

  sys.exit()
