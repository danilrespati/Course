from tkinter import *


def click_num(number):
    global math
    if math == "equ":
        display_num.delete(0, END)
        math = "none"
    current = display_num.get()
    if current == "" and number == 0:
        return
    display_num.delete(0, END)
    display_num.insert(0, current + str(number))
    return


def click_clear():
    global memory
    memory = 0
    display_num.delete(0, END)


def click_equal():
    global math
    second_number = display_num.get()
    if math == "equ":
        return
    elif math == "add":
        result = float(first_num) + float(second_number)
        math = "equ"
    elif math == "sub":
        result = float(first_num) - float(second_number)
        math = "equ"
    elif math == "mul":
        result = float(first_num) * float(second_number)
        math = "equ"
    elif math == "div":
        result = float(first_num) / float(second_number)
        math = "equ"
    display_num.delete(0, END)
    if result % 1 == 0:
        result = int(result)
    display_num.insert(0, result)
    return


def click_add():
    global first_num
    global math
    if math == "add":
        return
    math = "add"
    first_num = display_num.get()
    display_num.delete(0, END)
    return


def click_sub():
    global first_num
    global math
    if math == "sub":
        return
    math = "sub"
    first_num = display_num.get()
    display_num.delete(0, END)
    return


def click_mul():
    global first_num
    global math
    if math == "mul":
        return
    math = "mul"
    first_num = display_num.get()
    display_num.delete(0, END)
    return


def click_div():
    global first_num
    global math
    if math == "div":
        return
    math = "div"
    first_num = display_num.get()
    display_num.delete(0, END)
    return


math = "none"
first_num = 0
# Create a root window
root = Tk()
root.title('Calculator')
# Create widget
display_num = Entry(root, width=15, borderwidth=3,
                    font=("Helvetica", 30), justify='right')

button_0 = Button(root, text="0", padx=33, pady=15,
                  command=lambda: click_num(0))
button_1 = Button(root, text="1", padx=33, pady=15,
                  command=lambda: click_num(1))
button_2 = Button(root, text="2", padx=33, pady=15,
                  command=lambda: click_num(2))
button_3 = Button(root, text="3", padx=33, pady=15,
                  command=lambda: click_num(3))
button_4 = Button(root, text="4", padx=33, pady=15,
                  command=lambda: click_num(4))
button_5 = Button(root, text="5", padx=33, pady=15,
                  command=lambda: click_num(5))
button_6 = Button(root, text="6", padx=33, pady=15,
                  command=lambda: click_num(6))
button_7 = Button(root, text="7", padx=33, pady=15,
                  command=lambda: click_num(7))
button_8 = Button(root, text="8", padx=33, pady=15,
                  command=lambda: click_num(8))
button_9 = Button(root, text="9", padx=33, pady=15,
                  command=lambda: click_num(9))

button_div = Button(root, text="/", padx=33, pady=15,
                    command=click_div)
button_mul = Button(root, text="*", padx=33, pady=15,
                    command=click_mul)
button_sub = Button(root, text="-", padx=34, pady=15,
                    command=click_sub)
button_add = Button(root, text="+", padx=32, pady=15,
                    command=click_add)
button_equ = Button(root, text="=", padx=33, pady=15,
                    command=click_equal)
button_clr = Button(root, text="CLR", padx=25, pady=15,
                    command=click_clear)

# Put the widget into the root
display_num.grid(row=0, column=0, columnspan=4)

button_7.grid(row=1, column=0)
button_8.grid(row=1, column=1)
button_9.grid(row=1, column=2)

button_4.grid(row=2, column=0)
button_5.grid(row=2, column=1)
button_6.grid(row=2, column=2)

button_1.grid(row=3, column=0)
button_2.grid(row=3, column=1)
button_3.grid(row=3, column=2)

button_mul.grid(row=1, column=3)
button_div.grid(row=2, column=3)
button_sub.grid(row=3, column=3)

button_0.grid(row=4, column=0)
button_add.grid(row=4, column=1)
button_clr.grid(row=4, column=2)
button_equ.grid(row=4, column=3)

# Create the main loop
root.mainloop()
