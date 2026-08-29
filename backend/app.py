import joblib
from flask import Flask
from flask import Flask, request

app = Flask(__name__)

model = joblib.load('models/model.pkl')
amount_Scaler = joblib.load('models/amount_Scaler.pkl')
time_Scaler = joblib.load('models/time_Scaler.pkl')

@app.route('/')
@app.route('/predict', methods=['POST'])
def someName():
    return 'Hello World!'
def transactionData():
    data = request.get_json()
    print(data)
    return 'received'
if __name__ == '__main__':
    app.run(debug=True)