from tkinter import *

root = Tk()
root.title("Tkinter Course")
root.iconbitmap('my_icon.ico')
root.geometry("400x400")

toppings = [
    "Chesee",
    "Pepperoni",
    "Sausage",
    "Onion",
    "Meatball",
    "Bell Pepper",
    "Mushroom"
]
var_topping = []

Label(root, text="Choose your extra toppings:").pack()
for idx, topping in enumerate(toppings):
    var_topping.append(StringVar())
    c = Checkbutton(
        root, text=toppings[idx], variable=var_topping[idx], onvalue=toppings[idx], offvalue="0")
    c.deselect()
    c.pack()


def show():
    Label(root, text="Extra topping:").pack()
    for idx, item in enumerate(var_topping):
        if var_topping[idx].get() != "0":
            Label(root, text=var_topping[idx].get()).pack()


Button(root, text="Submit", command=show).pack()

root.mainloop()
