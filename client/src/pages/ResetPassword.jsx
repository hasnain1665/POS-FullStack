import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Container, Card } from "react-bootstrap";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const validationSchema = Yup.object().shape({
    password: Yup.string()
      .min(6, "At least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { data } = await axios.post(
        `http://localhost:8000/auth/reset-password/${token}`,
        { newPassword: values.password }
      );
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error:", error.response); // Log error details
      setMessage(error.response?.data?.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: "400px" }} className="p-4">
        <h3 className="text-center">Reset Password</h3>
        {message && <p className="text-success text-center">{message}</p>}
        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="mb-3">
                <label>New Password</label>
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
                <label>Confirm Password</label>
                <Field
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-danger"
                />
              </div>
              <Button type="submit" className="w-100" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </Container>
  );
};

export default ResetPassword;
