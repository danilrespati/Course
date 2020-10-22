from tkinter import *
from tkinter import messagebox

root = Tk()
root.title("Message Boxes")
root.iconbitmap('my_icon.ico')


def popup():
    # showinfo, showwarning, showerror, askquestion, askokcancel, askyesno
    result = messagebox.showinfo(
        "This is Popup Title", "This is popup content")
    # result = messagebox.showwarning(
    #     "This is Popup Title", "This is popup content")
    # result = messagebox.showerror(
    #     "This is Popup Title", "This is popup content")
    # result = messagebox.askquestion(
    #     "This is Popup Title", "This is popup content")
    # result = messagebox.askokcancel(
    #     "This is Popup Title", "This is popup content")
    # result = messagebox.askyesno(
    #     "This is Popup Title", "This is popup content")
    Label(root, text=result).pack()


Button(root, text="Click for Popup", command=popup).pack()
root.mainloop()
