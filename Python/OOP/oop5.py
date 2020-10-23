# Static method, its used for grouping(?) some functions to be more organized
class Math:
    @staticmethod
    def add5(x):
        return x + 5

    @staticmethod
    def add10(x):
        return x + 10

    @staticmethod
    def pr():
        print("Running...")


print(Math.add5(5))
print(Math.add10(5))
Math.pr()
