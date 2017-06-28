# To facilitate manual curation of CUI Map, identify the phenotypes with 90% probability mass in each time / topic
import sys
import csv
from TopicManager import TopicManager

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
    hpomap[t['cui']] = {
      'cui': t['cui'],
      'cui_name': t['cui_name'],
      'curated_name': t['curated_name'],
      'hpo': t['hpo'],
      'hpo_name': t['hpo_name']
      }

  return hpomap

def write_csv_ranked(data, filename):
  with open(filename, 'wb') as f:
    w = csv.writer(f)
    w.writerow( ['topic', 'time', 'cui', 'cui_name', 'curated_name' 'prob', 'hpo', 'hpo_name'] )
    for t in data:
      w.writerow( [t['topic'], t['time'], t['cui'], t['cui_name'], t['curated_name'], t['prob'], t['hpo'], t['hpo_name']] )
  f.close()

def write_csv_unique(data, filename):
  with open(filename, 'wb') as f:
    w = csv.writer(f)
    w.writerow( ['cui', 'cui_name', 'curated_name', 'prob', 'hpo', 'hpo_name'] )
    for t in data.values():  #dict
      w.writerow( [t['cui'], t['cui_name'], t['curated_name'], t['prob'], t['hpo'], t['hpo_name']] )
  f.close()


datasets = [
  '_20170227',
  '_20170228',
  '_20170322',
]

targetMass = 92
minProb = 0.001

if __name__ == '__main__':

  for dataset in datasets:
    print 'Processing', dataset
  
    ### Parse source data
    # source_topics = './data/cui/topics_print.csv'
    source_topics = './data/cui/topics_print%s.csv' % dataset

    # Parse data
    topics = TopicManager()
    topics.read_data(source_topics)

    # Load CUI -> HPO Map
    source_translations = './data/cui_hpo_map/cui-hpo-map%s.csv' % dataset
    translations = load_cui_hpo_translations(source_translations)

    # Get map from hpo to cui
    hpo_map = get_cui_hpo_map(translations)

    # Get ranked cuis
    rankedWords = []
    uniqueWords = {}
    maxProb = {}

    for topic in sorted(topics.topics.values(), key=lambda x: float(x.id)):
      print topic.id

      for time in sorted(topic.times.values(), key=lambda x: float(x.id)):
        print "  ", time.id

        totalMass = 0
        for i, word in enumerate(sorted(time.words.values(), key=lambda x: float(x.prob), reverse=True)):  # descending
          #print "    ", i, word.id, word.prob

          if totalMass > targetMass or word.prob < minProb:
            break

          if not word.id in hpo_map:
            continue

          totalMass += word.prob

          if not word.id in maxProb:
            maxProb[word.id] = 0
          if word.prob > maxProb[word.id]:
            maxProb[word.id] = word.prob

          transInfo = hpo_map[word.id]
          wordInfo = {
            'topic': topic.id,
            'time': time.id,
            'cui': word.id,
            'cui_name': transInfo['cui_name'],
            'curated_name': transInfo['curated_name'],
            'prob': word.prob,
            'hpo': transInfo['hpo'],
            'hpo_name': transInfo['hpo_name']
            }
          uniqueInfo = {
            'cui': word.id,
            'cui_name': transInfo['cui_name'],
            'curated_name': transInfo['curated_name'],
            'prob': maxProb[word.id],
            'hpo': transInfo['hpo'],
            'hpo_name': transInfo['hpo_name']
            }

          rankedWords.append( wordInfo )
          uniqueWords[word.id] = uniqueInfo



    # Ouput CSV of mapping
    write_csv_ranked(rankedWords, './data/cui_curation/cui-ordered%s.csv' % dataset)
    print 'Exported ranked CUIs per topic and time'

    write_csv_unique(uniqueWords, './data/cui_curation/cui-unique%s.csv' % dataset)
    print 'Exported unique CUIs'

  sys.exit()
