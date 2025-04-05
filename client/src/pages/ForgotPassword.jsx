import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Container, Card, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
  const [message, setMessage] = useState({ text: "", variant: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/forgot-password`,
        values
      );
      setMessage({
        text: data.message || "Password reset link sent to your email",
        variant: "success",
      });
      setIsSubmitted(true);
      resetForm();
    } catch (error) {
      setMessage({
        text:
          error.response?.data?.message ||
          "Failed to send reset link. Please try again.",
        variant: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Card className="forgot-password-card">
          <Card.Body>
            <div className="text-center mb-4">
              <h2>Forgot Password?</h2>
              <p className="text-muted">
                Enter your email to receive a reset link
              </p>
            </div>

            {message.text && (
              <Alert variant={message.variant} className="text-center">
                {message.text}
              </Alert>
            )}

            {!isSubmitted ? (
              <Formik
                initialValues={{ email: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, isValid }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email Address
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FiMail />
                        </span>
                        <Field
                          type="email"
                          name="email"
                          id="email"
                          className="form-control"
                          placeholder="your@email.com"
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100 mb-3"
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </Form>
                )}
              </Formik>
            ) : (
              <div className="text-center">
                <Alert variant="success" className="mb-4">
                  Check your email for the password reset link
                </Alert>
                <Link to="/login" className="btn btn-outline-primary">
                  <FiArrowLeft className="me-2" />
                  Back to Login
                </Link>
              </div>
            )}

            <div className="text-center mt-3">
              <Link to="/login" className="text-decoration-none">
                Remember your password? Sign in
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ForgotPassword;
