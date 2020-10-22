from tkinter import *

root = Tk()
root.title("Tkinter Course")
root.iconbitmap('my_icon.ico')

frame = LabelFrame(root, text="This is frame title", padx=5, pady=5)
frame.pack(padx=10, pady=10)

button_1 = Button(frame, text="This button is useless")
button_2 = Button(frame, text="So is this")
button_1.grid(row=0, column=0)
button_2.grid(row=1, column=1)

root.mainloop()
