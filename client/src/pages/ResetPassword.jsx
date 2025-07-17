import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaShieldAlt,
  FaKey,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/ResetPassword.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: "", variant: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = Yup.object().shape({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      )
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    setMessage({ text: "", variant: "" });

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/reset-password/${token}`,
        { newPassword: values.password }
      );
      setMessage({
        text: data.message || "Password reset successfully!",
        variant: "success",
      });
      setIsSubmitted(true);
      resetForm();
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setMessage({
        text:
          error.response?.data?.message ||
          "Failed to reset password. Please try again.",
        variant: "danger",
      });
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="reset-password-container">
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
        <div className="reset-password-wrapper">
          <div className="brand-section">
            <div className="brand-icon">
              <FaKey />
            </div>
            <h1 className="brand-title">Reset Password</h1>
            <p className="brand-subtitle">
              Create a new secure password for your account
            </p>
          </div>

          <Card className="reset-password-card">
            <Card.Body className="p-4 p-md-5">
              <div className="reset-password-header">
                <h2 className="reset-password-title">
                  {isSubmitted ? "Password Reset!" : "Set New Password"}
                </h2>
                <p className="reset-password-subtitle">
                  {isSubmitted
                    ? "Your password has been successfully reset"
                    : "Enter your new password below. Make sure it's strong and secure."}
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
                  initialValues={{ password: "", confirmPassword: "" }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, isValid, touched, errors }) => (
                    <Form className="reset-password-form">
                      <BootstrapForm.Group className="form-group">
                        <BootstrapForm.Label className="form-label">
                          New Password
                        </BootstrapForm.Label>
                        <div className="input-wrapper">
                          <InputGroup
                            className={`custom-input-group ${
                              touched.password && errors.password ? "error" : ""
                            }`}
                          >
                            <InputGroup.Text className="input-icon">
                              <FaLock />
                            </InputGroup.Text>
                            <Field
                              type={showPassword ? "text" : "password"}
                              name="password"
                              className="form-control custom-input"
                              placeholder="Enter your new password"
                            />
                            <InputGroup.Text
                              className="password-toggle"
                              onClick={togglePasswordVisibility}
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </InputGroup.Text>
                          </InputGroup>
                          <ErrorMessage
                            name="password"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </BootstrapForm.Group>

                      <BootstrapForm.Group className="form-group">
                        <BootstrapForm.Label className="form-label">
                          Confirm New Password
                        </BootstrapForm.Label>
                        <div className="input-wrapper">
                          <InputGroup
                            className={`custom-input-group ${
                              touched.confirmPassword && errors.confirmPassword
                                ? "error"
                                : ""
                            }`}
                          >
                            <InputGroup.Text className="input-icon">
                              <FaLock />
                            </InputGroup.Text>
                            <Field
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              className="form-control custom-input"
                              placeholder="Confirm your new password"
                            />
                            <InputGroup.Text
                              className="password-toggle"
                              onClick={toggleConfirmPasswordVisibility}
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </InputGroup.Text>
                          </InputGroup>
                          <ErrorMessage
                            name="confirmPassword"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </BootstrapForm.Group>

                      <div className="password-requirements">
                        <h6 className="requirements-title">
                          Password Requirements:
                        </h6>
                        <ul className="requirements-list">
                          <li>At least 6 characters long</li>
                          <li>Contains uppercase and lowercase letters</li>
                          <li>Contains at least one number</li>
                        </ul>
                      </div>

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
                            <span>Resetting...</span>
                          </div>
                        ) : (
                          <div className="btn-content">
                            <span>Reset Password</span>
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
                  <h3 className="success-title">
                    Password Reset Successfully!
                  </h3>
                  <p className="success-text">
                    Your password has been successfully reset. You can now use
                    your new password to sign in to your account.
                  </p>
                  <div className="success-actions">
                    <Button as={Link} to="/login" className="login-btn">
                      <span>Continue to Login</span>
                      <div className="btn-arrow">→</div>
                    </Button>
                  </div>
                </div>
              )}

              <div className="back-section">
                <Link to="/login" className="back-link">
                  <FaShieldAlt className="me-2" />
                  Back to Login
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;
