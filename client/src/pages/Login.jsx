import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../redux/authSlice";
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
  FaShieldAlt,
} from "react-icons/fa";
import axios from "axios";
import "../styles/Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        "http://localhost:8000/auth/login",
        values
      );
      dispatch(loginUser(data));
      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error.response?.data || error);
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Animation */}
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
        <div className="login-wrapper">
          <div className="brand-section">
            <h1 className="brand-title">POS App</h1>
          </div>

          <Card className="login-card">
            <Card.Body className="p-4 p-md-5">
              <div className="login-header">
                <h2 className="login-title">Welcome Back</h2>
                <p className="login-subtitle">
                  Sign in to your account to continue
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="error-alert">
                  <div className="error-content">
                    <FaUser className="error-icon" />
                    {error}
                  </div>
                </Alert>
              )}

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, isValid, touched, errors }) => (
                  <Form className="login-form">
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
                            placeholder="Enter your password"
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
                      </div>
                    </BootstrapForm.Group>

                    <div className="form-options">
                      <Link to="/forgot-password" className="forgot-link">
                        Forgot your password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="login-btn"
                      disabled={isSubmitting}
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
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="btn-content">
                          <span>Sign In</span>
                          <div className="btn-arrow">→</div>
                        </div>
                      )}
                    </Button>

                    <div className="signup-section">
                      <p className="signup-text">
                        Don't have an account?{" "}
                        <Link to="/signup" className="signup-link">
                          Create account
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

export default Login;
