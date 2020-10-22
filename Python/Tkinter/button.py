from tkinter import *


def on_click():
    myLabel = Label(root, text="Button Clicked!")
    myLabel.pack()


# Create a root window
root = Tk()

# Create a label widget
myButton1 = Button(root, text="Click Me!", state=DISABLED)
myButton2 = Button(root, text="Click Me!", padx=50, pady=50)
mybutton3 = Button(root, text="Click Me!",
                   command=on_click, bg='blue', fg='white')

# Put the label into the root
myButton1.pack()
myButton2.pack()
mybutton3.pack()

# Create the main loop
root.mainloop()
