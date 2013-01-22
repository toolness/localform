from wsgiref.simple_server import make_server
from wsgiref.util import FileWrapper
import os
import sys
import time
import mimetypes

try:
    import json
except ImportError:
    import simplejson as json

ROOT = os.path.abspath(os.path.dirname(__file__))

path = lambda *x: os.path.join(ROOT, *x)

sys.path.append(path('vendor'))

import argparse

def make_app():
    def app(environ, start_response):
        path = environ['PATH_INFO']

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
