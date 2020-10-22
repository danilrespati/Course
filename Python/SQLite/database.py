import sqlite3

# Connect to database
# conn = sqlite3.connect(':memory:')
# conn = sqlite3.connect('customer.db')

# Create a cursor
# c = conn.cursor()

# Create a table
# Datatypes: null, integer, real, text, blob
# c.execute("""CREATE TABLE customers(
#         first_name text,
#         last_name text,
#         email text
#     )""")

# Insert one record
# c.execute("INSERT INTO customers VALUES ('Jaka', 'Tingkir', 'jaka@gmail.com')")

# Insert multiple records
# many_customers = [
#     ('Pratikto', 'Sulthoni', 'toni@gmail.com'),
#     ('Guntur', 'Perdana', 'guntur@gmail.com'),
#     ('Rifmansyah', 'Yoga', 'yoga@gmail.com')
# ]
# c.executemany("INSERT INTO customers VALUES (?, ?, ?)", many_customers)

# Query the database
# c.execute("SELECT * FROM customers")
# print(c.fetchone())
# print(c.fetchmany(2))
# print(c.fetchall())

# Format your query
# c.execute("SELECT * FROM customers")
# items = c.fetchall()
# print("NAME\t\t\tEMAIL")
# print("----\t\t\t-----")
# for item in items:
#     print(item[0] + " " + item[1] + "\t" + item[2])

# Primary key
# In sqlite3, primary keys = rowid (auto generated)
# c.execute("SELECT rowid, * FROM customers")
# items = c.fetchall()
# for item in items:
#     print(item)

# Where cause
# c.execute("SELECT * FROM customers WHERE last_name = 'Respati'")
# items = c.fetchall()
# for item in items:
#     print(item)

# And/or cause
# c.execute("SELECT * FROM customers WHERE last_name = 'Respati' AND email LIKE '%@gmail.com'")
# c.execute("SELECT * FROM customers WHERE first_name = 'Aini' OR email LIKE '%@yahoo.com'")

# c.execute("SELECT * FROM customers WHERE email LIKE '%@yahoo.com'")
# items = c.fetchall()
# for item in items:
#     print(item)

# Update records
# update using primary key to avoid confusion
# c.execute("""UPDATE customers
#         SET last_name = 'Respati'
#         WHERE rowid = 2
#     """)

# Delete records
# c.execute("DELETE FROM customers WHERE rowid = 3")

# Order by
# c.execute("SELECT rowid, * FROM customers ORDER BY rowid DESC")
# c.execute("SELECT rowid, * FROM customers ORDER BY first_name")

# Limit results
# c.execute("SELECT rowid, * FROM customers LIMIT 4")
# c.execute("SELECT rowid, * FROM customers ORDER BY email DESC LIMIT 3")

# Drop table (delete)
# c.execute("DROP TABLE customers")

# Commit our command
# conn.commit()

# # Close our connection
# conn.close()


# Show all records
def show_all():
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.execute("SELECT rowid, * FROM customers")
    items = c.fetchall()
    for item in items:
        print(item)
    conn.close()


# Add a record
def add_one(first_name, last_name, email):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.execute("INSERT INTO customers VALUES (?, ?, ?)",
              (first_name, last_name, email))
    conn.commit()
    conn.close()


# Add many records
def add_many(list):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.executemany("INSERT INTO customers VALUES (?, ?, ?)", (list))
    conn.commit()
    conn.close()


# Delete a record
def delete_one(id):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.execute("DELETE FROM customers WHERE rowid = (?)", id)
    conn.commit()
    conn.close()


# Show email lookup
def email_lookup(email):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.execute("SELECT rowid, * FROM customers WHERE email LIke (?)", (email,))
    items = c.fetchall()
    for item in items:
        print(item)
    conn.close()
