import requests
contacts = [{"name": "danil", "age": 25, "gender": "male"},
            {"name": "aini", "age": 20, "gender": "female"},
            {"name": "yoga", "age": 101, "gender": "male"},
            {"name": "guntur", "age": 69, "gender": "male"}]

BASE = "http://127.0.0.1:5000/"

for i in range(len(contacts)):
    response = requests.put(BASE + "contact/" + str(i+1), contacts[i])
    print(response.json())

response = requests.get(BASE + "contact/1")
print(response.json())
response = requests.get(BASE + "contact/2")
print(response.json())
response = requests.get(BASE + "contact/3")
print(response.json())
response = requests.get(BASE + "contact/4")
print(response.json())

input()

# response = requests.patch(BASE + "contact/1", {"name": "danil", "age": 25, "gender": "male"})
# print(response.json())

# input()

# response = requests.delete(BASE + "contact/1")
# print(response)

# input()

response = requests.get(BASE + "contact/1")
print(response.json())
response = requests.get(BASE + "contact/2")
print(response.json())
response = requests.get(BASE + "contact/3")
print(response.json())
response = requests.get(BASE + "contact/4")
print(response.json())