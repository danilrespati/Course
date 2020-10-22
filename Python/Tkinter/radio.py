from tkinter import *

root = Tk()
root.title("Radio button example")
root.iconbitmap('my_icon.ico')


def submit_r():
    Label(frame, text=str(r.get())).pack()


frame = LabelFrame(root, text="Choose one:", padx=5, pady=5)
frame.pack(padx=10, pady=10)

r = IntVar()
Radiobutton(frame, text="Option 1", variable=r,
            value=1, command=submit_r).pack()
Radiobutton(frame, text="Option 2", variable=r,
            value=2, command=submit_r).pack()
button_submit = Button(frame, text="Submit", command=submit_r).pack()


def submit_flavor():
    Label(frame_flavor, text=str(var.get())).pack()


frame_flavor = LabelFrame(root, text="Choose your flavor:", padx=5, pady=5)
frame_flavor.pack(padx=10, pady=10)

flavors = [
    "Original",
    "Black Pepper",
    "Honey Garlic",
    "Korean Sauce",
    "Hot N Spicy",
    "Salted Egg",
    "Barbeque"
]
var = StringVar()
var.set(flavors[0])
for flavor in flavors:
    Radiobutton(frame_flavor, text=flavor, variable=var, value=flavor).pack()
button_flavor = Button(frame_flavor, text="Submit",
                       command=submit_flavor).pack()


root.mainloop()
