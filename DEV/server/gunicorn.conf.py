# pylint: skip-file
# gunicorn config file
loglevel = "debug"
errorlog = 'logs/error_log.txt'
accesslog = '-'

workers = 1
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"
