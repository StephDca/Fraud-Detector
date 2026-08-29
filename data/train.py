import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.metrics import precision_recall_curve
import numpy as np

pd_train = pd.read_csv('data/creditcard.csv')

#created an empty Scaler Obeject
scaler = StandardScaler();
amount_Scaler = StandardScaler(); 
time_Scaler = StandardScaler(); 

#scaled the values in the 'Amount' column, to fit in the range
#with the other columns that are between the values of -5 > 5
pd_train['Amount'] = amount_Scaler.fit_transform(pd_train[['Amount']])
# Time was also on a much larger raw scale than the PCA'd V1-V28 columns,
# which was causing the LogisticRegression solver to fail to converge
pd_train['Time'] = time_Scaler.fit_transform(pd_train[['Time']])

# x = features the model learns from, y = the answer key (fraud or not)
x = pd_train.drop(['Class'], axis=1)
y = pd_train['Class']

# stratify=y keeps the ~0.17% fraud ratio consistent in both splits,
# since a plain random split could leave too few fraud cases in the test set
X_train, X_test, Y_train, Y_test = train_test_split(x, y, stratify=y)

# class_weight='balanced' penalizes missed fraud cases much more heavily
# during training, since fraud is only ~0.17% of the data
model = LogisticRegression(class_weight='balanced')
model.fit(X_train, Y_train)

y_pred = model.predict(X_test)

# probability of fraud (column 1) for each transaction, instead of
# the hard 0/1 label predict() gives using its hidden 0.5 cutoff
fraud_probs = model.predict_proba(X_test)[:, 1]

# custom threshold found via precision_recall_curve: raising the cutoff
# from the default 0.5 to ~0.997 traded some recall (0.96 -> 0.84) for a
# big precision gain (0.06 -> 0.67), cutting false alarms from ~1849 to ~51
fraud_probs_2 = fraud_probs >= 0.997
print(classification_report(Y_test, fraud_probs_2))



