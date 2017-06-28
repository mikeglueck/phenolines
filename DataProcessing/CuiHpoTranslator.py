from Authentication import *
import requests
import json
import csv
import argparse
import collections
import sys
import os
reload(sys)
sys.setdefaultencoding('utf-8')


class CuiHpoTranslator:
    def __init__(self, apikey, version, verbose=False):
        # UMLS REST API Authentication Client
        self.AuthClient = Authentication(apikey)

        # Get TGT for our session
        self.tgt = self.AuthClient.gettgt()

        # Save version
        self.version = version

        # REST API base URI
        self.base_uri = "https://uts-ws.nlm.nih.gov/rest"

        # Verbose output flag
        self.verbose = verbose

        # Track translation stats
        self.cui_count = 0
        self.hpo_count = 0

        # Verify created tickets are valid
        query = {'ticket': self.AuthClient.getst(self.tgt), 'service': 'http://umlsks.nlm.nih.gov'}
        test_uri = 'https://utslogin.nlm.nih.gov/cas/serviceValidate'
        r = requests.get(test_uri, params=query)
        print r.text

    def details_code(self, path):
        query = {'ticket': self.AuthClient.getst(self.tgt)}
        r = requests.get(self.base_uri + path, params=query)

        try:
            items = json.loads(r.text)  # or r.json() ?
        except Exception as e:
            # print r.url
            # print '[', r.status_code, ']'
            # print r.text
            raise ValueError()
        else:
            return items

        return None

    def crosswalk_code(self, path):
        sabs = "HPO"
        ttys = "PT"
        query = {'ticket': self.AuthClient.getst(self.tgt),'sabs': sabs, 'ttys': ttys}

        # TODO: better error reporting
        # If webserver not responding
        # If webserver returns 403 -- error with tickets
        # If webserver returns 404 -- no associated value found
        r = requests.get(self.base_uri + path, params=query)

        try:
            items = json.loads(r.text)  # or r.json() ?
        except Exception as e:
            # print r.url
            # print '[', r.status_code, ']'
            # print r.text
            raise ValueError()
        else:
            return items

        return None

    def translate(self, cuis_list):
        # Queries on CUI nodes
        endpoint = "/content/"+ self.version +"/CUI"

        translations = []

        for code in cuis_list:
            self.cui_count += 1

            # Query path
            path = endpoint+"/"+code

            translate = {
                'cui': code,
                'cui_name': None,
                'hpo': None,
                'hpo_name': None,
                'ancestor': False,
                'class_type': None
            }

            try:
                results = self.details_code(path)

            except ValueError as e:
                if self.verbose:
                    print "No result found for", code, e
                pass

            else:
                r = results["result"]  # Only one result expected

                translate['cui_name'] = r['name']
                translate['class_type'] = r['classType']

                if self.verbose:
                    print 'CUI>', code, r['name'], r['classType']

                path = endpoint+"/"+code+"/atoms"
                try:
                    results = self.crosswalk_code(path)

                except ValueError as e:
                    if self.verbose:
                        print "No HPO term found", e
                    pass

                    # Add something here to do searches for ancestor CUIs

                else:
                    self.hpo_count += 1

                    for r in results["result"]:
                        hpo = r["code"].rsplit('/', 1)[1]
                        translate['hpo'] = hpo
                        translate['hpo_name'] = r['name']

                        if self.verbose:
                            print '    -->', 'HPO>', r["name"], hpo

            translations.append( translate )

        return translations

    def get_stats(self):
        return {'cui_count': self.cui_count, 'hpo_count': self.hpo_count}



# Run from command line
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='process user given parameters')
    parser.add_argument("-f", "--filename", required = True, dest = "filename", help = "filename of cuis to translate, one per line")
    parser.add_argument("-k", "--apikey", required = True, dest = "apikey", help = "enter api key from your UTS Profile")
    parser.add_argument("-v", "--version", required =  False, dest="version", default = "current", help = "enter version example-2015AA")

    args = parser.parse_args()

    translator = CuiHpoTranslator(args.apikey, args.version)

    cuis_list = []
    with open(args.filename,'rb') as f:
        for line in f:
            # Strip newlines, make uppercase
            cui = line.strip().upper()
            cuis_list.append(cui)

    translations = translator.translate(cuis_list)

    with open('./output/TEST_cui-hpo-translations.csv', 'wb') as csvfile:
        w = csv.writer(csvfile)
        w.writerow( ['cui', 'cui_name', 'class_type', 'hpo', 'hpo_name'] )
        for t in translations:
            w.writerow( [t['cui'], t['cui_name'], t['class_type'], t['hpo'], t['hpo_name']] )

    f.close()

    sys.exit()
    # sys.exit(main())
