# gunicorn config file
loglevel = "debug"
errorlog = 'error_log.txt'
accesslog = '-'

workers = 1
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"

access_log_format = "[%(t)s] %(m)s (%(s)s): '%(U)s%(q)s'"
