import joblib
from flask import Flask, request, jsonify
import pandas as pd

app = Flask(__name__)


model = joblib.load('models/model.pkl')
amount_Scaler = joblib.load('models/amount_Scaler.pkl')
time_Scaler = joblib.load('models/time_Scaler.pkl')


@app.route('/predict', methods=['POST'])
def transactionData():
    data = request.get_json()
    df = pd.DataFrame([data])
    df['Amount'] = amount_Scaler.transform(df[['Amount']])
    df['Time'] = time_Scaler.transform(df[['Time']])
    prediction = model.predict_proba(df)[:, 1]
    final_prediction = prediction[0] >= 0.997
    print(df)
    print(data)
    print(prediction)
    return 'received'

if __name__ == '__main__':
    app.run(debug=True)