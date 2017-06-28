import sys
import csv
import json
from json import encoder
import phenobackend.phenobackend as pb

import math
import pandas as pd
import numpy as np
from sklearn import preprocessing, linear_model, pipeline
from scipy import interpolate, stats, polyfit, polyval, sqrt, signal

### Script to generate PhenoLines data
# - Read in HPO data
# - Generate HPO subgraphs
# - Output JSON in PhenoLines format


# Format JSON float output
encoder.FLOAT_REPR = lambda o: format(o, '.10f')
json_indent = None
json_separators = (',', ':')

pretty_json = False

if pretty_json:
    json_indent = 2
    json_separators = (',', ': ')

def generate_patient(backend, patient):
  p = backend.patient(patient['id'], patient['present'], patient['absent'], patient['attr'])
  pt = backend.patient_tree(p)

  # Aggregate word prob up the tree
  for hp in patient['present']:  # patient['present'] may include invalid terms
    if hp['id'] not in pt.nodes:
      continue

    node = pt[hp['id']]

    # Add cui to all ancestors, aggregate probs
    ancestors = node.ancestors(exclude_self=False)
    for anc in ancestors:
      if not anc.attr('cuis'):
        #anc.attr('cuis', [hp['attr']['cui']])
        anc.attr('cuis', hp['attr']['cui'])
      else:
        # anc.attr('cuis', anc.attr('cuis') + [hp['attr']['cui']])
        anc.attr('cuis', anc.attr('cuis') + hp['attr']['cui'])

      if not anc.attr('prob'):
        anc.attr('prob', float(hp['attr']['prob']))
      else:
        #anc.attr('prob', anc.attr('prob') + float(hp['attr']['prob']))
        anc.attr('prob', 1.0 - (1.0 - anc.attr('prob')) * (1.0 - float(hp['attr']['prob'])))

  return pt

def generate_topic(backend, timestep):
  topic = []

  for patient in timestep:
    p = generate_patient(backend, patient)
    topic.append(p)

  return topic

def generate_trends(steps, intervals, scaler):
  # Create PatientTree to augment with measures
  timeseries = steps[0].deep_copy()

  # Extract all probs from steps for each node
  probs = {}
  for step in steps:
    for node_id in step.nodes:
      # Store probs in array for each node id
      if node_id not in probs:
        probs[node_id] = []
      probs[node_id].append(step[node_id].attr('prob'))

  # Normalize probs -- do not use this because it changes the probabilities
  # norm_probs = {}
  # for node_id in probs:
  #   norm_probs[node_id] = scaler.transform(np.array(probs[node_id]))

  # Update probs in timeseries -- not need node_type anymore, and moved prob later
  # for node_id in timeseries.nodes:
    # timeseries[node_id].attr('node_type', 'UP')  # For color mapping
    #timeseries[node_id].attr('prob', norm_probs[node_id]) # Set up timeseries list

  # Calculate trends in each group -- older code where there was a hierarchy for each interval
  # groups = []
  # for interval in intervals:
  #   group = timeseries.deep_copy()

  #   for node_id in group.nodes:
  #     group[node_id].attr('interval', interval)
  #     group[node_id].attr('prob', list(probs[node_id])[interval[0]:interval[1]])  # Slice data
  #     group[node_id].attr('meanprob', np.mean(group[node_id].attr('prob')))  # Mean of probs
  #     group[node_id].attr('trend', polyfit_regression(probs[node_id], interval))

  #   groups.append(group)

  # return groups

  # Normalization scaler
  min_max_scaler = preprocessing.MinMaxScaler()

  # Calculate trends overall and for each interval
  trends = timeseries.deep_copy()
  groups = [trends]

  for node_id in trends.nodes:
    node = trends[node_id]

    maxpercprob = 0
    maxintervalid = 0  # TODO: Should this be None?  Then filter out values with null in Javascript?
    maxinterval = intervals[0]

    for i, interval in enumerate(intervals):
      interval_data = list(probs[node_id])[interval[0]:interval[1]]
      meanprob = np.mean(interval_data)
      percprob = np.percentile(interval_data, 95)
      maxprob = np.max(interval_data)
      trend = polyfit_regression(probs[node_id], interval)

      # Normalized trend
      # min_max_scaler.fit(np.array(probs[node_id]))
      # probsnorm = min_max_scaler.transform(np.array(probs[node_id]))
      # trendnorm = polyfit_regression(probsnorm, interval)

      if i == 0:
        node.attr('interval', interval)
        node.attr('prob', interval_data)  # Slice data
        node.attr('meanprob', meanprob)  # Mean of probs
        node.attr('percprob', percprob)  # 95th percentile of probs
        node.attr('maxprob', maxprob)  # Max of probs
        node.attr('trend', trend)
        #node.attr('trendnorm', trendnorm)

      else:
        split_data = {
          'interval': interval,
          'prob': interval_data,  # Slice data
          'meanprob': meanprob,  # Mean of probs
          'percprob': percprob,  # 95th percentile of probs
          'maxprob': maxprob,
          'trend': trend,
          #'trendnorm': trendnorm
        }
       
        splits = node.attr('splits')
        if not splits:
          splits = [split_data]
        else:
          splits.append( split_data )

        node.attr('splits', splits)

        # Find max interval of splits
        # if maxpercprob < percprob:
        #   maxpercprob = percprob
        #   maxinterval = interval
        #   maxintervalid = i
        if maxpercprob < maxprob:
          maxpercprob = maxprob
          maxinterval = interval
          maxintervalid = i

    node.attr('maxinterval', maxinterval)
    node.attr('maxintervalid', maxintervalid)

  return groups

def polyfit_regression(data, interval):
    # Slice to interval
    points = data[interval[0]:interval[1]]
    
    # Prep data
    length = interval[1] - interval[0]
    Y = points
    X = np.arange(interval[1] - interval[0])  # interval starts at idx 0
    
    # Linear regressison -polyfit - polyfit can be used other orders polys
    slope, intercept = polyfit(X, Y, 1)
    
    # Compute the mean square error
    fit_line = polyval([slope, intercept], X)
    err = sqrt(sum((fit_line-Y)**2)/length)
    
    return (slope, intercept, err)

def generate_importance(groups):
  # Iterate over groups and calculate importance
  # Importance score is SNR of prob / hpo ic (prior)
  for group in groups:
    importance = {}

    for node_id in group.nodes:
      #prob = group[node_id].attr('meanprob')  # Mean prob of time segment
      #prob = group[node_id].attr('percprob')  # 95th percentile prob of time segment
      prob = group[node_id].attr('maxprob')  # Max prob of time segment

      if prob == 0:  # isn't this the same as the inf check later?
        importance[node_id] = None
      else:
        prior = np.exp(-group[node_id].attr('base_ic'))  # Convert to prob
        importance[node_id] = 10 * np.log10(prob / prior) # Decibels
        if math.isinf(importance[node_id]):  # Check for inf/-inf
          importance[node_id] = None

    percentiles = {}
    scores = importance.values()
    #percs = stats.rankdata(scores, "average")/len(scores)   # more performant but need to map back to dict afterwards...
    #thres = np.percentile(scores, p)
    for node_id in importance:
      perc = 0
      if importance[node_id] is not None:  # Mark None as 0th percentile...
        perc = stats.percentileofscore(scores, importance[node_id])
      percentiles[node_id] = perc
      #print node_id, importance[node_id], perc

    # Store values
    for node_id in group.nodes:
      group[node_id].attr('importance', importance[node_id])
      group[node_id].attr('percentile', percentiles[node_id])

    # Store max values
    for node_id in group.nodes:
      ancestors = group[node_id].ancestors(exclude_self=False)
      for anc in ancestors:
        if not anc.attr('maxpercentile'):
          anc.attr('maxpercentile', group[node_id].attr('percentile'))
        else:
          if group[node_id].attr('percentile') > anc.attr('maxpercentile'):
            anc.attr('maxpercentile', group[node_id].attr('percentile'))

  return groups

def output_timeseries_json(topics, filename):
  output = []

  for topic in topics:
    phenos = {}

    for pt in topic['steps']:
      for hpid in pt.nodes:
        hp = pt.nodes[hpid]

        if not hpid in phenos:
          phenos[hpid] = create_timeseries_node(hp)

        phenos[hpid]['probs'].append(hp.attr('prob'))

    output.append(phenos)

  with open(filename, 'w') as f:
    f.write(json.dumps(output, sort_keys=True, indent=json_indent, separators=json_separators))

def create_timeseries_node(hp):
  return {
    'id': hp.id,
    'name': hp.attr('name'),
    'ic_base': hp.attr('base_ic'),
    'ic_cond': hp.attr('conditional_ic'),
    'is_leaf': (len(hp.children) == 0),
    'probs': []
  }


# Output CSV for testing in notebook
def output_timeseries_csv(topics, filename):
  output = []

  for topic_id, topic in enumerate(topics):
    for time_id, pt in enumerate(topic['steps']):
      for hpid in pt.nodes:
        hp = pt.nodes[hpid]

        rec = []
        rec.append(topic_id)
        rec.append(hp.id)
        rec.append(hp.attr('name'))
        rec.append(hp.attr('base_ic'))
        rec.append(hp.attr('conditional_ic'))
        rec.append((len(hp.children) == 0))
        rec.append(time_id)
        rec.append(hp.attr('prob'))

        output.append(rec)

  headers = [
    'topic_id',
    'hp_id',
    'name',
    'ic_base',
    'ic_cond',
    'is_leaf',
    'time_id',
    'prob'
    ]
  write_csv(output, headers, filename)

def write_csv(data, headers, filename):
  with open(filename, 'wb') as f:
    w = csv.writer(f)
    w.writerow( headers )
    for t in data:
      w.writerow( t )
  f.close()

def output_phenolines_data(topics, filename):
  output = []

  for topic in topics:
    topic_out = {
      # 'steps': [],
      # 'groups': [],
      'overall': []
    }

    #for lod in topic:
    for lod in topic_out:  # filter output
      lod_out = []

      # Define attribute remapping
      attrMap = {
        'hpo': 'hpo',
        'name': 'name',
        'base_ic': 'ic_base',
        'conditional_ic': 'ic_cond',
        # 'node_type': 'node_type',
        # 'modifiers': 'modifiers',
        # 'cuis': 'cuis',
        'interval': 'interval',
        'prob': 'prob',
        'meanprob': 'meanprob',
        'percprob': 'percprob',
        'maxprob': 'maxprob',
        'trend': 'trend',
        #'trendnorm': 'trendnorm',
        'importance': 'importance',
        'percentile': 'percentile',
        'maxpercentile': 'maxpercentile',
        'splits': 'splits',
        'maxinterval': 'maxinterval',
        'maxintervalid': 'maxintervalid'
      }

      for step in topic[lod]:
        # Convert to JSON
        buf = step.root.to_dict(childrenAttr='branchset', attrMap=attrMap)
        lod_out.append(buf)

      topic_out[lod] = lod_out

    output.append(topic_out)

  with open(filename, 'w') as f:
    f.write(json.dumps(output, sort_keys=True, indent=json_indent, separators=json_separators))


datasets = [
  '_20170227',
  '_20170228',
  '_20170322',
]

if __name__ == '__main__':
  backend = pb.PhenoBackend()

  for dataset in datasets:
    print 'Processing', dataset

    print 'Loading source data...'
    with open('./data/hpo/diseases%s.json' % dataset) as f:
      data = json.load(f)
    f.close()

    print 'Generating datasets...'

    # Stores lists of PatientTrees for each timestop
    topics = []

    # Generate HPOs for each timestep
    for topic in data['topics']:
      # PatientTree for each timestep in each topic; aggregate probs through hierarchy
      steps = generate_topic(backend, topic['cohorts'][0]['patients'])  # patients are timesteps

      topic_pheno = {
        'steps': steps,
        'groups': [],
        'overall': []
      }

      topics.append(topic_pheno)

    # Get all probs (including computed aggregates) and init scaler
    data_range = []
    for topic in topics:
      steps = topic['steps']
      for step in steps:
        for node_id in step.nodes:
          data_range.append(step[node_id].attr('prob'))

    min_max_scaler = preprocessing.MinMaxScaler()
    min_max_scaler.fit(np.array(data_range))

    # Set up intervals
    data_length = len(steps)
    intervals = [(0, data_length)]

    # Use splits?
    use_splits = True
    if use_splits:
      # TODO: use 2, 5, 10, 16 and check if max value is over the length of dataset
      #splits = [2, 6, 12]  # TODO: this should be a config value
      splits = [2, 5, 10, 16]
      last_split = 0
      for split in splits:
          if split < data_length-2:
            intervals.append((last_split, split+1))  # +1 because range excludes upper
            last_split = split
      intervals.append((last_split, data_length))

    for topic in topics:
      steps = topic['steps']

      # Compute PatientTree for each interval
      trends = generate_trends(steps, intervals, min_max_scaler)

      trends = generate_importance(trends)

      topic['groups'] = trends[1:]
      topic['overall'] = trends[0:1]
    

    suffix = ''
    if not pretty_json:
      suffix = '.min'

    # Extract unique nodes with associated time series of probs
    # output_timeseries_json(topics, './data/pheno/test_output_timeseries%s%s.json' % (dataset, suffix))
    # output_timeseries_csv(topics, './data/pheno/test_output_timeseries%s.csv' % dataset)
    
    # Generate statistics and create PhenoLines visualization data
    output_phenolines_data(topics, './data/pheno/test_output_topics%s%s.json' % (dataset, suffix))

  print 'Exported HPO Phenotype data'

  sys.exit()
