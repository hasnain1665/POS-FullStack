import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Button,
  Container,
  Card,
  Alert,
  Spinner,
  InputGroup,
  Form as BootstrapForm,
} from "react-bootstrap";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaUserShield,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import "../styles/Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .required("Password is required"),
    role: Yup.string()
      .oneOf(["admin", "cashier"], "Invalid role selected")
      .required("Role is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post("http://localhost:8000/auth/register", values);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Signup Error:", error.response?.data || error);
      setError(
        error.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role) => {
    return role === "admin" ? <FaUserShield /> : <FaUser />;
  };

  const getRoleDescription = (role) => {
    return role === "admin"
      ? "Full access to all features and settings"
      : "Access to POS operations and basic features";
  };

  return (
    <div className="signup-container">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>
      </div>

      <Container className="d-flex justify-content-center align-items-center min-vh-100 px-3">
        <div className="signup-wrapper">
          <div className="brand-section">
            <h1 className="brand-title">Join POS App</h1>
            <p className="brand-subtitle">Create your account to get started</p>
          </div>

          <Card className="signup-card">
            <Card.Body className="p-4 p-md-5">
              <div className="signup-header">
                <h2 className="signup-title">Create Account</h2>
                <p className="signup-subtitle">
                  Fill in your details to create a new account
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="error-alert">
                  <div className="alert-content">
                    <FaExclamationTriangle className="alert-icon" />
                    {error}
                  </div>
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="success-alert">
                  <div className="alert-content">
                    <FaCheckCircle className="alert-icon" />
                    {success}
                  </div>
                </Alert>
              )}

              <Formik
                initialValues={{
                  name: "",
                  email: "",
                  password: "",
                  role: "cashier",
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, isValid, touched, errors, values }) => (
                  <Form className="signup-form">
                    <BootstrapForm.Group className="form-group">
                      <BootstrapForm.Label className="form-label">
                        Full Name
                      </BootstrapForm.Label>
                      <div className="input-wrapper">
                        <InputGroup
                          className={`custom-input-group ${
                            touched.name && errors.name ? "error" : ""
                          }`}
                        >
                          <InputGroup.Text className="input-icon">
                            <FaUser />
                          </InputGroup.Text>
                          <Field
                            type="text"
                            name="name"
                            className="form-control custom-input"
                            placeholder="Enter your full name"
                          />
                        </InputGroup>
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </BootstrapForm.Group>

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

                    <BootstrapForm.Group className="form-group">
                      <BootstrapForm.Label className="form-label">
                        Password
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
                            placeholder="Create a strong password"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                            type="button"
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </InputGroup>
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="error-message"
                        />
                        <div className="password-requirements">
                          <small className="text-muted">
                            Password must contain at least 6 characters, one
                            uppercase letter, and one number
                          </small>
                        </div>
                      </div>
                    </BootstrapForm.Group>

                    <BootstrapForm.Group className="form-group">
                      <BootstrapForm.Label className="form-label">
                        Account Role
                      </BootstrapForm.Label>
                      <div className="input-wrapper">
                        <InputGroup
                          className={`custom-input-group ${
                            touched.role && errors.role ? "error" : ""
                          }`}
                        >
                          <InputGroup.Text className="input-icon">
                            {getRoleIcon(values.role)}
                          </InputGroup.Text>
                          <Field
                            as="select"
                            name="role"
                            className="form-control custom-input custom-select"
                          >
                            <option value="cashier">Cashier</option>
                            <option value="admin">Admin</option>
                          </Field>
                        </InputGroup>
                        <ErrorMessage
                          name="role"
                          component="div"
                          className="error-message"
                        />
                        <div className="role-description">
                          <small className="text-muted">
                            {getRoleDescription(values.role)}
                          </small>
                        </div>
                      </div>
                    </BootstrapForm.Group>

                    <Button
                      type="submit"
                      className="signup-btn"
                      disabled={isSubmitting}
                    >
                      {isLoading ? (
                        <div className="btn-content">
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="btn-spinner"
                          />
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <div className="btn-content">
                          <span>Create Account</span>
                          <div className="btn-arrow">→</div>
                        </div>
                      )}
                    </Button>

                    <div className="login-section">
                      <p className="login-text">
                        Already have an account?{" "}
                        <Link to="/" className="login-link">
                          Sign in here
                        </Link>
                      </p>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default Signup;
