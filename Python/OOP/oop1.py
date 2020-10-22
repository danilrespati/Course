# Object Oriented Programming in Python

def hello():
    print("Hello World!")


# x is an object with a type='int' and value=1
x = 1

# y is an object with a type='str' and value="Hello"
y = "Hello"

print(type(hello))
print(type(x))
print(type(y))

string = "hello"
# EX: upper() is a method you can use to an object with type='str'
print(string.upper())


class Dog:
    # special method, this method will be called instantly after the object is created
    def __init__(self, name, age):
        # create attribute of the class Dog
        self.name = name  # this doesn't have to be identical
        self.age = age
    # method is a function that goes inside of a class

    def bark(self):
        print("bark")

    def add_one(self, x):
        return x + 1

    def get_name(self):
        return self.name

    def get_age(self):
        return self.age

    def set_age(self, age):
        self.age = age


# create Dog object
d = Dog("Spot", 5)
print(d.name)  # access the class attribute
print(d.age)
d2 = Dog("Ditto", 14)
print(d2.get_name())
print(d2.get_age())
d2.set_age(20)
print(d2.get_age())

# calling the method we made for object Dog
d.bark()
print(d.add_one(5))
print(type(d))
