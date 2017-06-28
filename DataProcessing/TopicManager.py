import csv

class Word:
  def __init__(self, word, prob):
    self.id = word
    self.prob = float(prob)
    
class Time:
  def __init__(self, time_id):
    self.id = time_id
    self.words = dict()

  def has_word(self, word_id):
    return word_id in self.words

  def get_word(self, word_id):
    if word_id in self.words:
      return self.words[word_id]
    return None

  def add_word(self, word):
    self.words[word.id] = word

class Topic:
  def __init__(self, topic_id):
    self.id = topic_id
    self.times = dict()

  def has_time(self, time_id):
    return time_id in self.times

  def get_time(self, time_id):
    if time_id in self.times:
      return self.times[time_id]
    return None

  def add_time(self, time):
    self.times[time.id] = time

class TopicManager:
  def __init__(self):
    self.topics = dict()
    self.cuis = set()

  def has_topic(self, topic_id):
    return topic_id in self.topics

  def get_topic(self, topic_id):
    if topic_id in self.topics:
      return self.topics[topic_id]
    return None

  def add_topic(self, topic):
    self.topics[topic.id] = topic

  def get_unique_cuis(self):
    return list(self.cuis)

  def add_cui(self, word_id):
    self.cuis.add(word_id)

  def parse_row(self, row):
    # Expecting header row format [topic, time, prob, word]
    topic_id = row['topic']
    time_id = row['time']
    word_id = row['word'].upper()  # Ensure uppercase
    word_prob = row['prob']

    if self.has_topic(topic_id):
      topic = self.get_topic(topic_id)
    else:
      topic = Topic(topic_id)
      self.add_topic(topic)

    if topic.has_time(time_id):
      time = topic.get_time(time_id)
    else:
      time = Time(time_id)
      topic.add_time(time)

    if time.has_word(word_id):
      print "! warning overwriting", topic_id, time_id, word_id
    time.add_word( Word(word_id, word_prob) )

    # Track unique CUIs
    self.add_cui(word_id)

  def read_data(self, filename):
    with open(filename, 'rb') as csvfile:
      # Read CSV data
      data = csv.DictReader(csvfile)

      for row in data:
        self.parse_row(row)

    csvfile.close()

  def map_to_hpo(self, hpo_map):
    pass
