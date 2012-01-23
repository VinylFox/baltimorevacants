import logging
import simplejson
import os 
import cgi
import urllib

from google.appengine.api import memcache
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

class Data(webapp.RequestHandler):
    def get(self):
        domain = "data.baltimorecity.gov"
        url = "https://" + domain + "/api/views/INLINE/rows.json?method=index"
        token = 'GSoNHBCEoKECW0LC5vClT3pkb'
        
        urlparts = self.request.uri.split("/")
        urllen = len(urlparts)
        
        uid = urlparts[urllen-5]
        column_name = urlparts[urllen-4]
        lat = urlparts[urllen-3]
        lon = urlparts[urllen-2]
        radius = urlparts[urllen-1]
        
        mcs = 'source-'+uid+'-'+str(lat)+'-'+str(lon)+'-'+str(radius)

        logging.info(mcs)

        in_cache = None #memcache.get(mcs)

        if in_cache is not None:
            content = in_cache
            if content == 'oversize':
                logging.info('data is oversized')
                oscache = ''
                for i in range(0,5):
                    chunk = memcache.get(mcs+'-'+str(i))
                    if chunk is not None:
                        oscache = oscache + chunk
                content = oscache
        else:
            
            col_url = "http://data.baltimorecity.gov/api/views/"+uid+"/columns.json"
            col_result = urlfetch.fetch(url=col_url,
                    method=urlfetch.GET,
                    headers={'Content-Type': 'application/json', 
                             'X-App-Token': token},
                    deadline=240)
                
            col_content = col_result.content
            
            logging.info(col_content)
            
            if col_content.startswith('['):
                columns_array = simplejson.loads(col_content)
                for column in columns_array:
                    logging.info(column.get('fieldName'))
                    if column.get('fieldName') == column_name:
                        columnId = column.get('id')
            else:
                columnId = 0
            
            logging.info(columnId)
            
            form_fields = {
                "originalViewId": uid,
                "name": "Inline View",
                "query": {
                    "filterCondition": {
                        "type" : "operator",
                        "value" : "AND",
                        "children" : [{
                            "type": "operator",
                            "value": "WITHIN_CIRCLE",
                            "children": [{
                                "columnId": columnId,
                                "type": "column"
                            }, {
                                "type": "literal",
                                "value": lat
                            }, {
                                "type": "literal",
                                "value": lon
                            }, {
                                "type": "literal",
                                "value": int(radius)
                            }]
                        }]
                    }
                }
            }
    
            if not memcache.add(mcs, "processing"):
                logging.info("error adding placeholder to memcache")
            else:
                logging.info("added placeholder to memcache as %s", mcs)
    
            form_data = simplejson.dumps(form_fields)
            logging.info(url+'|'+form_data)
            try:
                result = urlfetch.fetch(url=url,
                    payload=form_data,
                    method=urlfetch.POST,
                    headers={'Content-Type': 'application/json', 
                             'X-App-Token': token},
                    deadline=240)
                
                content = result.content
                ctmax = 1000000
                ctlen = len(content)
                
                if ctlen > ctmax:
                    origcontent = content
                    logging.info('length too large for cache ('+str(ctlen)+')')
                    content = "oversize"
                    if not memcache.set(mcs, content):
                        logging.info("error adding source data to memcache")
                    else:
                        logging.info("added source data to memcache as %s", mcs)
                    ctchunks = int(math.ceil(ctlen/ctmax))
                    for i in range(0,ctchunks+1):
                        if not memcache.set(mcs+'-'+str(i), origcontent[i*ctmax:(i+1)*ctmax]):
                            logging.info("error adding source data to memcache")
                        else:
                            logging.info("added source data to memcache as %s-%s", mcs, i)
                    content = origcontent
                else:
                    if not memcache.set(mcs, content):
                        logging.info("error adding source data to memcache")
                    else:
                        logging.info("added source data to memcache as %s", mcs)
                
            except:
                content = "{success:false}"

        self.response.headers['Content-Type'] = "application/json; charset=utf8"
        self.response.out.write(content)
        
application = webapp.WSGIApplication([('/data/.*', Data)], debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()