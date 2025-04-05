import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../redux/authSlice";
import { Button, Container, Card, Alert, Spinner, InputGroup, Form as BootstrapForm } from "react-bootstrap";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
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
      setError(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 px-3">
      <Card className="login-card w-100" style={{ maxWidth: "400px" }}>
        <Card.Body className="p-3 p-md-4">
          <h3 className="text-center mb-4">Login</h3>
          
          {error && (
            <Alert variant="danger" className="text-center mb-3">
              {error}
            </Alert>
          )}

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, isValid }) => (
              <Form>
                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label>Email</BootstrapForm.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaEnvelope />
                    </InputGroup.Text>
                    <Field 
                      type="email" 
                      name="email" 
                      className="form-control" 
                      placeholder="Enter your email"
                    />
                  </InputGroup>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-danger small mt-1"
                  />
                </BootstrapForm.Group>

                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label>Password</BootstrapForm.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaLock />
                    </InputGroup.Text>
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      placeholder="Enter your password"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      className="d-flex align-items-center"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-danger small mt-1"
                  />
                </BootstrapForm.Group>

                <div className="d-flex justify-content-between mb-4">
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-100 py-2" 
                  disabled={isSubmitting || !isValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-decoration-none fw-semibold">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </Form>
            )}
          </Formik>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;