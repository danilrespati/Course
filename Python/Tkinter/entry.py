from tkinter import *


def on_click():
    msg = "Hello " + myEntry.get() + "!"
    myLabel = Label(root, text=msg)
    myLabel.grid(row=1, columnspan=2)


# Create a root window
root = Tk()

# Create widget
myEntry = Entry(root, width=20, borderwidth=3)
myButton = Button(root, text="Enter your name", command=on_click)

# Put the label into the root
myEntry.grid(row=0, column=0)
myButton.grid(row=0, column=1)

# Create the main loop
root.mainloop()
