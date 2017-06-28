import sys
import csv
import json
from json import encoder
from TopicManager import TopicManager
import urllib
import urllib2

### Script to get HPO rec from NCR

def write_csv(data, filename):
  with open(filename, 'wb') as f:
    w = csv.writer(f)
    w.writerow( ['cui', 'cui_name', 'curated_name', 'hpo', 'hpo_name', 'hpo_prob'] )
    for t in data:
      w.writerow( [t['cui'], t['cui_name'], t['curated_name'], t['hpo'], t['hpo_name'], t['hpo_prob']] )
  f.close()

def load_cui_hpo_translations(filename):
  translations = []

  with open(filename, 'rb') as csvfile:
    data = csv.DictReader(csvfile)
    for row in data:
      translations.append(row)
  csvfile.close()

  return translations

def query_ncr(term):
  query_term = urllib.quote_plus( term.lower().replace("/", "") )

  try:
    res = json.loads( urllib2.urlopen("http://ncr.ccm.sickkids.ca/v1.2/term/%s" % query_term).read() )
  except urllib2.HTTPError:
    print "Err:", term, query_term
  else:
    return res

  return [{'score': 0}]

def translate_with_ncr(term_list):
  for i, term in enumerate(term_list):

    if i > 0 and i % 500 == 0:
      print i, "processed"

    hasHpo = (len(term['hpo']) > 0)

    term['hpo_prob'] = 1.0

    if not hasHpo:
      name = term['curated_name']

      if len(name) == 0:
        print term

      recs = query_ncr(name)

      useRec = recs[0]

      if useRec['score'] > 0.5:
        term['hpo_prob'] = useRec['score']
        term['hpo'] = useRec['hp_id']
        term['hpo_name'] = useRec['names'][0]

  return term_list


datasets = [
  '_20170227',
  '_20170228',
  '_20170322',
]

if __name__ == '__main__':
  for dataset in datasets:
    print 'Processing', dataset

    # Load CUI -> HPO Map
    source_translations = './data/cui_phenotypes/cui-phenotypes%s.csv' % dataset
    translations = load_cui_hpo_translations(source_translations)

    # Get filtered phenotypes
    terms = translate_with_ncr(translations)

    # Save as csv
    write_csv(terms, './data/cui_hpo_map/cui-hpo-map%s.csv' % dataset)

  print 'Exported hpo map from NCR'

  sys.exit()
