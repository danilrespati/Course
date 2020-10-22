from tkinter import *

# Create a root window
root = Tk()

# Create a label widget
myLabel1 = Label(root, text="Hello World!")
myLabel2 = Label(root, text="My name is Taufiq Dhanial")

# Put the label into the root
myLabel1.grid(row=0, column=0)
myLabel2.grid(row=1, column=1)

# Create the main loop
root.mainloop()
