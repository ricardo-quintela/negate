from flask import Flask, render_template, redirect, request, abort

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"


@app.route("/")
def home():
    app.logger.debug("Request to '/'")
    return render_template("home.html")
