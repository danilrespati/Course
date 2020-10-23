# Class attributes and class method
class Person:
    persons = 0

    def __init__(self, name):
        self.name = name
        Person.add_person()

    @classmethod
    def number_of_people(cls):
        return cls.number_of_people

    @classmethod
    def add_person(cls):
        cls.persons += 1


p1 = Person("John")
p2 = Person("Elder")
Person.add_person()
print(Person.persons)
