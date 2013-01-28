from wsgiref.simple_server import make_server
from wsgiref.util import FileWrapper
import os
import sys
import time
import mimetypes
import sqlite3

try:
    import json
except ImportError:
    import simplejson as json

ROOT = os.path.abspath(os.path.dirname(__file__))

path = lambda *x: os.path.join(ROOT, *x)

sys.path.append(path('vendor'))

import argparse

def insert_db_row(conn, submission):
    c = conn.cursor()
    c.execute("INSERT INTO submissions VALUES (NULL, DATETIME('now'), ?)",
              (json.dumps(submission),))
    conn.commit()
    c.close()

def get_db_rows(conn):
    c = conn.cursor()
    for row in c.execute('''SELECT id, timestamp as 'ts [timestamp]', data
                            FROM submissions'''):
        yield {
            'id': row[0],
            'timestamp': row[1],
            'submission': json.loads(row[2])
        }
    c.close()

def init_db():
    dbpath = path('submissions.db')
    conn = sqlite3.connect(dbpath, detect_types=sqlite3.PARSE_DECLTYPES |
                                                sqlite3.PARSE_COLNAMES)
    c = conn.cursor()
    try:
        c.execute("SELECT * FROM submissions")
    except sqlite3.OperationalError:
        print "Initializing database %s." % dbpath
        c.execute('''CREATE TABLE submissions(
                       id INTEGER PRIMARY KEY,
                       timestamp DATETIME,
                       data BLOB
                     )''')
        conn.commit()
    c.close()
    return conn

def make_app():
    def app(environ, start_response):
        path = environ['PATH_INFO']

        if path == '/submit':
            length = int(environ['CONTENT_LENGTH'])
            payload = json.loads(environ['wsgi.input'].read(length))
            conn = init_db()
            insert_db_row(conn, payload)
            conn.close()
            print "Stored %d bytes of submission data." % length
            start_response('200 OK', [('Content-Type', 'text/plain')])
            return ['Thanks!']
        if path.endswith('/'):
            path = '%sindex.html' % path
        fileparts = path[1:].split('/')
        fullpath = os.path.join(ROOT, 'static-files', *fileparts)
        fullpath = os.path.normpath(fullpath)
        (mimetype, encoding) = mimetypes.guess_type(fullpath)
        if (fullpath.startswith(ROOT) and
            not '.git' in fullpath and
            os.path.isfile(fullpath) and
            mimetype):
            filesize = os.stat(fullpath).st_size
            start_response('200 OK', [('Content-Type', mimetype),
                                      ('Content-Length', str(filesize))])
            return FileWrapper(open(fullpath, 'rb'))

        start_response('404 Not Found', [('Content-Type', 'text/plain')])
        return ['Not Found: ', path]

    return app

def cmd_serve(args):
    "run development web server"
    
    ipstr = args.ip
    if not ipstr:
        ipstr = 'all IP interfaces'
    server = make_server(args.ip, args.port, make_app())
    print "serving on %s port %d" % (ipstr, args.port)
    server.serve_forever()

def cmd_serve_args(parser):
    parser.add_argument('--port', help='port to serve on',
                        type=int, default=8000)
    parser.add_argument('--ip', help='IP to bind to',
                        default='')    

def cmd_list(args):
    "list submissions"

    for row in get_db_rows(init_db()):
        print row

def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    globs = globals()
    for name in globs:
        if name.startswith('cmd_') and not name.endswith('_args'):
            cmdfunc = globs[name]
            subparser = subparsers.add_parser(name[4:], help=cmdfunc.__doc__)
            subparser.set_defaults(func=cmdfunc)
            add_args = globs.get('%s_args' % name)
            if add_args:
                add_args(subparser)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()