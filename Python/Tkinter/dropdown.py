from tkinter import *

root = Tk()
root.title("Tkinter Course")
root.iconbitmap('my_icon.ico')
root.geometry("400x400")

days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
]
day = StringVar()
day.set(days[0])
OptionMenu(root, day, *days).pack()


def show():
    Label(root, text=day.get()).pack()


Button(root, text="Submit", command=show).pack()
root.mainloop()
