import socket


def send_msg(msg):
    msg_length = str(len(msg)).encode(FORMAT)
    msg_length += b' ' * (HEADER - len(msg))
    client.send(msg_length)
    msg = msg.encode(FORMAT)
    client.send(msg)


HEADER = 64
FORMAT = 'utf-8'
DIS_MSG = '!DISCONNECTED'
EXIT_MSG = '!EXIT'
PORT = 5050
SERVER = socket.gethostbyname(socket.gethostname())
ADDR = (SERVER, PORT)

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(ADDR)
