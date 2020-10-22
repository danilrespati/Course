from tkinter import *

root = Tk()
root.title("Tkinter Course")
root.iconbitmap('my_icon.ico')
root.geometry("400x400")

height = Scale(root, from_=0, to=500)
width = Scale(root, from_=0, to=500, orient=HORIZONTAL)
height.pack()
width.pack()


def resize():
    root.geometry(str(width.get()) + "x" + str(height.get()))


Button(root, text="Resize", command=resize).pack()

root.mainloop()
