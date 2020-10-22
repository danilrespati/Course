# Inheritance

# Initial class without inheritance
# class Cat():
#     def __init__(self, name, age):
#         self.name = name
#         self.age = age

#     def speak(self):
#         print("Meow")


# class Dog():
#     def __init__(self, name, age):
#         self.name = name
#         self.age = age

#     def speak(self):
#         print("Bark")

# Class with inheritance
class Pet():
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def show(self):
        print(f"I am {self.name} and I am {self.age} years old")

    def speak(self):
        print("I don't know what to say")


class Cat(Pet):  # Child/derived class to Pet
    def speak(self):  # Overwrite the speak method
        print("Meow")


class Dog(Pet):
    def speak(self):
        print("Bark")


class Fish(Pet):
    pass


p = Pet("Bruno", 14)
p.show()
p.speak()

c = Cat("Lily", 10)
c.show()
c.speak()

d = Dog("Andre", 20)
d.show()
d.speak()

f = Fish("Jonny", 12)
f.show()
f.speak()
