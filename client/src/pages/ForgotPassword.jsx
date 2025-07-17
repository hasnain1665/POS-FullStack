import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Button,
  Container,
  Card,
  Alert,
  Spinner,
  InputGroup,
  Form as BootstrapForm,
} from "react-bootstrap";
import axios from "axios";
import {
  FaEnvelope,
  FaArrowLeft,
  FaCheckCircle,
  FaShieldAlt,
  FaKey,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
  const [message, setMessage] = useState({ text: "", variant: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    setMessage({ text: "", variant: "" });

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
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      <Container className="d-flex justify-content-center align-items-center min-vh-100 px-3">
        <div className="forgot-password-wrapper">
          <div className="brand-section">
            <h1 className="brand-title">POS App</h1>
          </div>

          <Card className="forgot-password-card">
            <Card.Body className="p-4 p-md-5">
              <div className="forgot-password-header">
                <h2 className="forgot-password-title">
                  {isSubmitted ? "Check Your Email" : "Forgot Password?"}
                </h2>
                <p className="forgot-password-subtitle">
                  {isSubmitted
                    ? "We've sent a password reset link to your email address"
                    : "Enter your email address and we'll send you a link to reset your password"}
                </p>
              </div>

              {message.text && (
                <Alert variant={message.variant} className="custom-alert">
                  <div className="alert-content">
                    {message.variant === "success" ? (
                      <FaCheckCircle className="alert-icon" />
                    ) : (
                      <FaShieldAlt className="alert-icon" />
                    )}
                    {message.text}
                  </div>
                </Alert>
              )}

              {!isSubmitted ? (
                <Formik
                  initialValues={{ email: "" }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, isValid, touched, errors }) => (
                    <Form className="forgot-password-form">
                      <BootstrapForm.Group className="form-group">
                        <BootstrapForm.Label className="form-label">
                          Email Address
                        </BootstrapForm.Label>
                        <div className="input-wrapper">
                          <InputGroup
                            className={`custom-input-group ${
                              touched.email && errors.email ? "error" : ""
                            }`}
                          >
                            <InputGroup.Text className="input-icon">
                              <FaEnvelope />
                            </InputGroup.Text>
                            <Field
                              type="email"
                              name="email"
                              className="form-control custom-input"
                              placeholder="Enter your email address"
                            />
                          </InputGroup>
                          <ErrorMessage
                            name="email"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </BootstrapForm.Group>

                      <Button
                        type="submit"
                        className="reset-btn"
                        disabled={isSubmitting || !isValid}
                      >
                        {isSubmitting ? (
                          <div className="btn-content">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="btn-spinner"
                            />
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <div className="btn-content">
                            <span>Send Reset Link</span>
                            <div className="btn-arrow">→</div>
                          </div>
                        )}
                      </Button>
                    </Form>
                  )}
                </Formik>
              ) : (
                <div className="success-section">
                  <div className="success-icon">
                    <FaCheckCircle />
                  </div>
                  <h3 className="success-title">Email Sent!</h3>
                  <p className="success-text">
                    We've sent a password reset link to your email address.
                    Please check your inbox and follow the instructions to reset
                    your password.
                  </p>
                  <div className="success-actions">
                    <Button
                      as={Link}
                      to="/login"
                      variant="outline-primary"
                      className="back-btn"
                    >
                      <FaArrowLeft className="me-2" />
                      Back to Login
                    </Button>
                  </div>
                </div>
              )}

              <div className="back-section">
                <Link to="/login" className="back-link">
                  <FaArrowLeft className="me-2" />
                  Remember your password? Sign in
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword;
