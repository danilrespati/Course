from tkinter import *
from PIL import ImageTk, Image


def forward(image_number):
    global viewer
    global button_back
    global button_forw
    global status_bar

    viewer.grid_forget()
    viewer = Label(image=image_list[image_number - 1])

    button_forw = Button(
        root, text=">>", command=lambda: forward(image_number + 1))
    button_back = Button(
        root, text="<<", command=lambda: back(image_number - 1))
    if image_number == len(image_list):
        button_forw = Button(root, text=">>", state=DISABLED)

    status_bar = Label(root, text="Image " + str(image_number) +
                       " of " + str(len(image_list)), bd=1, relief=SUNKEN, anchor=W)

    viewer.grid(row=0, column=0, columnspan=3)
    button_back.grid(row=1, column=0)
    button_forw.grid(row=1, column=2)
    status_bar.grid(row=2, column=0, columnspan=3, sticky=W + E)


def back(image_number):
    global viewer
    global button_back
    global button_forw
    global status_bar

    viewer.grid_forget()
    viewer = Label(image=image_list[image_number - 1])

    button_forw = Button(
        root, text=">>", command=lambda: forward(image_number + 1))
    button_back = Button(
        root, text="<<", command=lambda: back(image_number - 1))
    if image_number == 1:
        button_back = Button(root, text="<<", state=DISABLED)

    status_bar = Label(root, text="Image " + str(image_number) +
                       " of " + str(len(image_list)), bd=1, relief=SUNKEN, anchor=W)

    viewer.grid(row=0, column=0, columnspan=3)
    button_back.grid(row=1, column=0)
    button_forw.grid(row=1, column=2)
    status_bar.grid(row=2, column=0, columnspan=3, sticky=W + E)


# Create a root window
root = Tk()
root.title("Image viewer")
root.iconbitmap('my_icon.ico')

# Create widget
image_1 = ImageTk.PhotoImage(Image.open("pictures/photo1.jpg"))
image_2 = ImageTk.PhotoImage(Image.open("pictures/photo2.jpg"))
image_3 = ImageTk.PhotoImage(Image.open("pictures/photo3.jpg"))
image_4 = ImageTk.PhotoImage(Image.open("pictures/photo4.jpg"))
image_5 = ImageTk.PhotoImage(Image.open("pictures/photo5.jpg"))
image_6 = ImageTk.PhotoImage(Image.open("pictures/photo6.jpg"))
image_7 = ImageTk.PhotoImage(Image.open("pictures/photo7.jpg"))
image_8 = ImageTk.PhotoImage(Image.open("pictures/photo8.jpg"))
image_list = [image_1, image_2, image_3,
              image_4, image_5, image_6, image_7, image_8]
viewer = Label(image=image_list[0])

button_back = Button(root, text="<<", state=DISABLED)
button_quit = Button(root, text="Exit", command=root.quit)
button_forw = Button(root, text=">>", command=lambda: forward(2))

status_bar = Label(root, text="Photo 1 of " +
                   str(len(image_list)), bd=1, relief=SUNKEN, anchor=W)

# Put the widget into the root
viewer.grid(row=0, column=0, columnspan=3, pady=5)
button_back.grid(row=1, column=0, pady=5)
button_quit.grid(row=1, column=1, pady=5)
button_forw.grid(row=1, column=2, pady=5)
status_bar.grid(row=2, column=0, columnspan=3, sticky=W + E)

# Create the main loop
root.mainloop()
