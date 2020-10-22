from tkinter import *
import sqlite3

root = Tk()
root.title("Tkinter Course")
root.iconbitmap('my_icon.ico')
# root.geometry("400x400")

conn = sqlite3.connect('address_book.db')
c = conn.cursor()

# c.execute("""CREATE TABLE addresses (
#         first_name text,
#         last_name text,
#         address text,
#         city text,
#         state text,
#         zipcode integer
#         )""")

w_label = 10
f_name_label = Label(root, text="First Name", width=w_label, anchor=W)
f_name_label.grid(row=0, column=0, padx=(10, 0), pady=(10, 0))
l_name_label = Label(root, text="Last Name", width=w_label, anchor=W)
l_name_label.grid(row=1, column=0, padx=(10, 0))
address_label = Label(root, text="Address", width=w_label, anchor=W)
address_label.grid(row=2, column=0, padx=(10, 0))
city_label = Label(root, text="City", width=w_label, anchor=W)
city_label.grid(row=3, column=0, padx=(10, 0))
state_label = Label(root, text="State", width=w_label, anchor=W)
state_label.grid(row=4, column=0, padx=(10, 0))
zipcode_label = Label(root, text="Zipcode", width=w_label, anchor=W)
zipcode_label.grid(row=5, column=0, padx=(10, 0))

w_entry = 30
f_name_entry = Entry(root, width=w_entry)
f_name_entry.grid(row=0, column=1, padx=(0, 10), pady=(10, 0))
l_name_entry = Entry(root, width=w_entry)
l_name_entry.grid(row=1, column=1, padx=(0, 10))
address_entry = Entry(root, width=w_entry)
address_entry.grid(row=2, column=1, padx=(0, 10))
city_entry = Entry(root, width=w_entry)
city_entry.grid(row=3, column=1, padx=(0, 10))
state_entry = Entry(root, width=w_entry)
state_entry.grid(row=4, column=1, padx=(0, 10))
zipcode_entry = Entry(root, width=w_entry)
zipcode_entry.grid(row=5, column=1, padx=(0, 10))


def submit():
    conn = sqlite3.connect('address_book.db')
    c = conn.cursor()
    c.execute("""INSERT INTO addresses VALUES (
        :f_name, :l_name, :address, :city, :state, :zipcode)""",
              {
                  'f_name': f_name_entry.get(),
                  'l_name': l_name_entry.get(),
                  'address': address_entry.get(),
                  'city': city_entry.get(),
                  'state': state_entry.get(),
                  'zipcode': zipcode_entry.get()
              })
    f_name_entry.delete(0, END)
    l_name_entry.delete(0, END)
    address_entry.delete(0, END)
    city_entry.delete(0, END)
    state_entry.delete(0, END)
    zipcode_entry.delete(0, END)
    conn.commit()
    conn.close()


submit_button = Button(root, text="Submit", command=submit)
submit_button.grid(row=6, column=0, columnspan=2,
                   padx=10, pady=(10, 0), sticky=W + E)


def query():
    query_window = Toplevel()
    query_window.title("DB Records")
    query_window.iconbitmap('my_icon.ico')
    conn = sqlite3.connect('address_book.db')
    c = conn.cursor()
    c.execute("SELECT rowid, * FROM addresses")
    query = c.fetchall()
    for row, records in enumerate(query):
        for column, record in enumerate(records):
            query_label = Label(query_window, text=query[row][column])
            query_label.grid(row=row, column=column, padx=5, sticky=W)
    conn.commit()
    conn.close()


query_button = Button(root, text="Show Records", command=query)
query_button.grid(row=7, column=0, columnspan=2,
                  padx=10, pady=10, sticky=W + E)


def update(rowid):
    print("Updated!")
    conn = sqlite3.connect('address_book.db')
    c = conn.cursor()
    c.execute("""UPDATE addresses SET
        first_name = :f_name,
        last_name = :l_name,
        address = :address,
        city = :city,
        state = :state,
        zipcode = :zipcode
        WHERE rowid = :rowid""",
              {
                  'f_name': f_name_editor.get(),
                  'l_name': l_name_editor.get(),
                  'address': address_editor.get(),
                  'city': city_editor.get(),
                  'state': state_editor.get(),
                  'zipcode': zipcode_editor.get(),
                  'rowid': rowid
              })

    conn.commit()
    conn.close()


def delete(rowid):
    conn = sqlite3.connect('address_book.db')
    c = conn.cursor()
    c.execute("DELETE FROM addresses WHERE rowid = " + str(rowid))
    edit_window.destroy()
    conn.commit()
    conn.close()


def edit(id):
    global edit_window
    edit_window = Toplevel()
    edit_window.title("Edit Record")
    edit_window.iconbitmap('my_icon.ico')
    conn = sqlite3.connect('address_book.db')
    c = conn.cursor()
    c.execute("SELECT * FROM addresses WHERE rowid = :id", {'id': id})
    records = c.fetchone()
    f_name_label = Label(edit_window, text="First Name",
                         width=w_label, anchor=W)
    f_name_label.grid(row=0, column=0, padx=(10, 0), pady=(10, 0))
    l_name_label = Label(edit_window, text="Last Name",
                         width=w_label, anchor=W)
    l_name_label.grid(row=1, column=0, padx=(10, 0))
    address_label = Label(edit_window, text="Address", width=w_label, anchor=W)
    address_label.grid(row=2, column=0, padx=(10, 0))
    city_label = Label(edit_window, text="City", width=w_label, anchor=W)
    city_label.grid(row=3, column=0, padx=(10, 0))
    state_label = Label(edit_window, text="State", width=w_label, anchor=W)
    state_label.grid(row=4, column=0, padx=(10, 0))
    zipcode_label = Label(edit_window, text="Zipcode", width=w_label, anchor=W)
    zipcode_label.grid(row=5, column=0, padx=(10, 0))

    global f_name_editor, l_name_editor, address_editor, city_editor, state_editor, zipcode_editor
    f_name_editor = Entry(edit_window, width=w_entry)
    f_name_editor.insert(0, records[0])
    f_name_editor.grid(row=0, column=1, padx=(0, 10), pady=(10, 0))
    l_name_editor = Entry(edit_window, width=w_entry)
    l_name_editor.insert(0, records[1])
    l_name_editor.grid(row=1, column=1, padx=(0, 10))
    address_editor = Entry(edit_window, width=w_entry)
    address_editor.insert(0, records[2])
    address_editor.grid(row=2, column=1, padx=(0, 10))
    city_editor = Entry(edit_window, width=w_entry)
    city_editor.insert(0, records[3])
    city_editor.grid(row=3, column=1, padx=(0, 10))
    state_editor = Entry(edit_window, width=w_entry)
    state_editor.insert(0, records[4])
    state_editor.grid(row=4, column=1, padx=(0, 10))
    zipcode_editor = Entry(edit_window, width=w_entry)
    zipcode_editor.insert(0, records[5])
    zipcode_editor.grid(row=5, column=1, padx=(0, 10))

    save_button = Button(edit_window, text="Save",
                         command=lambda: update(id))
    save_button.grid(row=6, column=0, columnspan=2,
                     padx=10, pady=(10, 0), sticky=W + E)

    delete_button = Button(edit_window, text="Delete",
                           command=lambda: delete(id))
    delete_button.grid(row=7, column=0, columnspan=2,
                       padx=10, pady=10, sticky=W + E)

    conn.commit()
    conn.close()


edit_label = Label(root, text="Insert ID", width=w_label, anchor=W)
edit_label.grid(row=8, column=0, padx=(10, 0))
edit_entry = Entry(root, width=w_entry)
edit_entry.grid(row=8, column=1, padx=(0, 10))

edit_button = Button(root, text="Edit", command=lambda: edit(edit_entry.get()))
edit_button.grid(row=9, column=0, columnspan=2,
                 padx=10, pady=10, sticky=W + E)

conn.commit()
conn.close()

root.mainloop()
