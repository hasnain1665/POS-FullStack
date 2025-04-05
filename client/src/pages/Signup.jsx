import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Container, Card } from "react-bootstrap";

const Signup = () => {
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "At least 6 characters")
      .required("Password is required"),
    role: Yup.string()
      .oneOf(["admin", "cashier"], "Invalid role")
      .required("Role is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await axios.post("http://localhost:8000/auth/register", values);
      alert("Signup successful! Please log in.");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    }
    setSubmitting(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: "400px" }} className="p-4">
        <h3 className="text-center">Sign Up</h3>
        <Formik
          initialValues={{ name: "", email: "", password: "", role: "cashier" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="mb-3">
                <label>Name</label>
                <Field type="text" name="name" className="form-control" />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-danger"
                />
              </div>
              <div className="mb-3">
                <label>Email</label>
                <Field type="email" name="email" className="form-control" />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-danger"
                />
              </div>
              <div className="mb-3">
                <label>Password</label>
                <Field
                  type="password"
                  name="password"
                  className="form-control"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-danger"
                />
              </div>
              <div className="mb-3">
                <label>Role</label>
                <Field as="select" name="role" className="form-control">
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </Field>
                <ErrorMessage
                  name="role"
                  component="div"
                  className="text-danger"
                />
              </div>
              <Button type="submit" className="w-100" disabled={isSubmitting}>
                {isSubmitting ? "Signing up..." : "Sign Up"}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </Container>
  );
};

export default Signup;
