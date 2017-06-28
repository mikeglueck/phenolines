import sys
import csv
from CuiHpoTranslator import CuiHpoTranslator
from TopicManager import TopicManager

### Script to process CUI -> HPO map
# - Read in output from Topic Modeling output
# - Extract unique CUI terms
# - Query UMLS REST API to translate to HPO terms
# - Output CSV of HPO terms


def write_csv(data, filename):
  with open(filename, 'wb') as f:
    w = csv.writer(f)
    w.writerow( ['cui', 'cui_name', 'class_type', 'hpo', 'hpo_name'] )
    for t in data:
      w.writerow( [t['cui'], t['cui_name'], t['class_type'], t['hpo'], t['hpo_name']] )
  f.close()


datasets = [
  '_20170227',
  '_20170228',
  '_20170322',
]

if __name__ == '__main__':
  for dataset in datasets:
    print 'Processing', dataset

    # Get api key
    # TODO: ADD ERROR IF FILE NOT EXISTS
    with open('./umls-api-key.txt', 'rb') as key:
      apikey = key.read().strip()
    version = 'current'

    # Init translator
    translator = CuiHpoTranslator(apikey, version, verbose=True)

    ### Parse source data
    # source_topics = './data/cui/topics_print.csv'
    source_topics = './data/cui/topics_print%s.csv' % dataset

    # Parse data
    topics = TopicManager()
    topics.read_data(source_topics)

    # Create CUI->HPO map
    cuis_list = topics.get_unique_cuis()
    print 'Processing CUIS:', len(cuis_list)
    translations = translator.translate(cuis_list)
    stats = translator.get_stats()
    print stats

    # Ouput CSV of mapping
    write_csv(translations, './data/umls_terms/cui-hpo-translations%s.csv' % dataset)
    print 'Exported CUI->HPO map'

  sys.exit()
