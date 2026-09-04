import pandas as pd

pd_generate = pd.read_csv('data/creditcard.csv')

fraud_rows = pd_generate[pd_generate['Class'] == 1].sample(5)
non_fraud_rows = pd_generate[pd_generate['Class'] == 0].sample(5)

sample_data = pd.concat([fraud_rows, non_fraud_rows]).drop(columns='Class')

sample_data.to_json('backend/static/sample_transactions.json',
                    orient='records')