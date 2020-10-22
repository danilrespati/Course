# Object Oriented Programming in Python

class Student:
    def __init__(self, name, age, grade):
        self.name = name
        self.age = age
        self.grade = grade  # 1-100

    def get_grade(self):
        return self.grade


class Course:
    def __init__(self, name, max_student):
        self.name = name
        self.max_student = max_student
        self.students = []  # Empty attribute

    def add_student(self, student):
        if len(self.students) < self.max_student:
            self.students.append(student)
            return True
        return False

    def get_average_grade(self):
        value = 0
        for student in self.students:
            value += student.get_grade()
        return value / len(self.students)


s1 = Student("Danil", 20, 95)
s2 = Student("John", 20, 80)
s3 = Student("Brian", 21, 65)

course1 = Course("science", 2)
course1.add_student(s1)
course1.add_student(s2)

print(course1.students[0].name)
print(course1.add_student(s3))  # the course is full (max_student=2), then it return False
print(course1.get_average_grade())
