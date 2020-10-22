from tkinter import *
from PIL import ImageTk, Image

root = Tk()
root.title("Add New Window")
root.iconbitmap('my_icon.ico')


def surprise():
    global img
    branch = Toplevel()
    branch.title("Second Window")
    branch.iconbitmap('my_icon.ico')
    img = ImageTk.PhotoImage(Image.open("pictures/photo1.jpg"))
    Label(branch, image=img).pack()
    Button(branch, text="Exit", command=branch.destroy).pack()


Button(root, text="Click me!", command=surprise).pack()

mainloop()
