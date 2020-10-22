from tkinter import *
import requests
import json

root = Tk()
root.title("Weather")
root.iconbitmap('my_icon.ico')


lat = -6.182198
lon = 106.944695
key = "09db432ed3d67ca77b58bc62f57efdd9"

# http://api.openweathermap.org/data/2.5/weather?lat=-6.182198&lon=106.944695&appid=09db432ed3d67ca77b58bc62f57efdd9

try:
    api_request = requests.get("http://api.openweathermap.org/data/2.5/weather?lat=" +
                               str(lat) + "&lon=" + str(lon) + "&appid=" + str(key) + "&lang=id")
    api = json.loads(api_request.content)
    print(api)
    for each in api:
        data = str(each) + ': ' + str(api[each])
        print(data)
        Label(root, text=data).pack(anchor=W)
except Exception as e:
    print(e)
    api = "Error..."

root.mainloop()

# {
# 'coord': {'lon': 106.94, 'lat': -6.18},
# 'weather': [{'id': 721, 'main': 'Haze', 'description': 'haze', 'icon': '50n'}],
# 'base': 'stations',
# 'main': {'temp': 300.1, 'feels_like': 303.75, 'temp_min': 299.82, 'temp_max': 300.37, 'pressure': 1008, 'humidity': 78},
# 'visibility': 5000,
# 'wind': {'speed': 2.1, 'deg': 200},
# 'clouds': {'all': 20},
# 'dt': 1602961320,
# 'sys': {'type': 1, 'id': 9384, 'country': 'ID', 'sunrise': 1602973776, 'sunset': 1603017890},
# 'timezone': 25200,
# 'id': 1649378,
# 'name': 'Bekasi',
# 'cod': 200
# }
