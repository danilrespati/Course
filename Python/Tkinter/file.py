from tkinter import *
from tkinter import filedialog
from PIL import ImageTk, Image

root = Tk()
root.title("Tkinter Course")
root.iconbitmap('my_icon.ico')


def open():
    global img
    path = filedialog.askopenfilename(initialdir="D:/Course/Tkinter", title="Select a file",
                                      filetypes=(("All Files", "*.*"), ("JPG Files", "*.jpg"), ("PNG Files", "*.png")))
    Label(root, text=path).pack()
    img = ImageTk.PhotoImage(Image.open(path))
    Label(root, image=img).pack()


Button(root, text="Open file", command=open).pack()
root.mainloop()
