# Simple Pong Game

import turtle


def paddle_l_up():
    y = paddle_l.ycor()
    print(y)
    if y >= 240:
        return
    y += 20
    paddle_l.sety(y)


def paddle_l_down():
    y = paddle_l.ycor()
    print(y)
    if y <= -240:
        return
    y -= 20
    paddle_l.sety(y)


def paddle_r_up():
    y = paddle_r.ycor()
    print(y)
    if y >= 240:
        return
    y += 20
    paddle_r.sety(y)


def paddle_r_down():
    y = paddle_r.ycor()
    print(y)
    if y <= -240:
        return
    y -= 20
    paddle_r.sety(y)


wn = turtle.Screen()
wn.title("Pong by @danilrespati")
wn.bgcolor("black")
wn.setup(width=800, height=600)
wn.tracer()

# Paddle L
paddle_l = turtle.Turtle()
paddle_l.speed(0)
paddle_l.color("white")
paddle_l.shape("square")
paddle_l.shapesize(stretch_wid=5, stretch_len=1)
paddle_l.penup()
paddle_l.goto(-350, 0)

# Paddle R
paddle_r = turtle.Turtle()
paddle_r.speed(0)
paddle_r.color("white")
paddle_r.shape("square")
paddle_r.shapesize(stretch_wid=5, stretch_len=1)
paddle_r.penup()
paddle_r.goto(+350, 0)

# Ball
ball = turtle.Turtle()
ball.speed(0)
ball.color("white")
ball.shape("square")
ball.penup()
ball.goto(0, 0)

wn.listen()
wn.onkeypress(paddle_l_up, "w")
wn.onkeypress(paddle_l_down, "s")
wn.onkeypress(paddle_r_up, "Up")
wn.onkeypress(paddle_r_down, "Down")

# Main game loop
while True:
    wn.update()
