import pandas as pd
from sklearn.preprocessing import StandardScaler 
from sklearn.model_selection import train_test_split  
from sklearn.linear_model import LogisticRegression  
from sklearn.metrics import classification_report

pd_train = pd.read_csv('data/creditcard.csv')

#created an empty Scaler Obeject 
scaler = StandardScaler(); 

#scaled the values in the 'Amount' column, to fit in the range
#with the other columns that are between the values of -5 > 5
pd_train['Amount'] = scaler.fit_transform(pd_train[['Amount']])
pd_train['Time'] = scaler.fit_transform(pd_train[['Time']])

x = pd_train.drop(['Class'], axis=1)
y = pd_train['Class']

X_train, X_test, Y_train, Y_test = train_test_split(x, y, stratify=y)

model = LogisticRegression(class_weight='balanced')
model.fit(X_train, Y_train)

y_pred = model.predict(X_test)

print(classification_report(Y_test, y_pred))



