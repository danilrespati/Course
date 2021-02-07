from flask import Flask
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
api = Api(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)

class ContactModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)

    def __repr__(self):
        return f"Contact(name = {name}, age = {age}, gender = {gender})"

# db.create_all()

contact_put_args = reqparse.RequestParser()
contact_put_args.add_argument("name", type=str, required=True, help="Name field is required")
contact_put_args.add_argument("age", type=int, required=True, help="Age field is required")
contact_put_args.add_argument("gender", type=str, required=True, help="This is gender field")

contact_update_args = reqparse.RequestParser()
contact_update_args.add_argument("name", type=str, help="Name field is required")
contact_update_args.add_argument("age", type=int, help="Age field is required")
contact_update_args.add_argument("gender", type=str, help="This is gender field")

resource_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'age': fields.Integer,
    'gender': fields.String
}

class Contact(Resource):
    @marshal_with(resource_fields)
    def get(self, contact_id):
        result = ContactModel.query.filter_by(id=contact_id).first()
        if not result:
            abort(404, message="Contact ID is not exist...")
        return result

    @marshal_with(resource_fields)
    def put(self, contact_id):
        args = contact_put_args.parse_args()
        result = ContactModel.query.filter_by(id=contact_id).first()
        if result:
            abort(409, message="Contact ID is already exist...")
        contact = ContactModel(id=contact_id, name=args['name'], age=args['age'], gender=args['gender'])
        db.session.add(contact)
        db.session.commit()
        return contact, 201

    @marshal_with(resource_fields)
    def patch(self, contact_id):
        args = contact_update_args.parse_args()
        result = ContactModel.query.filter_by(id=contact_id).first()
        if not result:
            abort(404, message="Contact ID is not exist...")

        for i in args:
            if args[i]:
                setattr(result, i, args[i])

        db.session.commit()
        return result

    @marshal_with(resource_fields)
    def delete(self, contact_id):
        result = ContactModel.query.filter_by(id=contact_id).delete()
        if not result:
            abort(404, message="Contact ID is not exist...")
        db.session.commit()
        return '', 204

api.add_resource(Contact, "/contact/<int:contact_id>")


if __name__ == '__main__':
    app.run(debug=True)