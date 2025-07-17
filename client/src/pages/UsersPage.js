import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { AccessDeniedAlert } from "../utils/auth";
import {
  Table,
  Button,
  Form,
  Container,
  Row,
  Col,
  Modal,
  Alert,
  Badge,
  Spinner,
  InputGroup,
  Card,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiAlertTriangle,
} from "react-icons/fi";
import { Formik, Field, Form as FormikForm } from "formik";
import * as Yup from "yup";
import {
  getUsers,
  deleteUser,
  addUser,
  updateUser,
} from "../services/userService";
import { checkAccess } from "../utils/auth";
import "../styles/Product.css";

const UsersPage = () => {
  const [state, setState] = useState({
    users: [],
    loading: true,
    error: null,
    alert: null,
    search: "",
    role: "",
    modals: {
      showUserModal: false,
      selectedUser: null,
      showDeleteModal: false,
      userToDelete: null,
    },
    deleting: false,
  });

  // Check access first - same logic as DashboardPage
  const accessDenied = checkAccess(["cashier"]);

  // Auto-dismiss alert after 3 seconds
  useEffect(() => {
    if (state.alert) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, alert: null }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.alert]);

  const fetchUsers = useCallback(async () => {
    // Don't fetch if access is denied - same as DashboardPage
    if (accessDenied) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getUsers(state.search, state.role);
      setState((prev) => ({
        ...prev,
        users: data.users || [],
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch users",
        users: [],
      }));
    }
  }, [state.search, state.role, accessDenied]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const showDeleteConfirmation = (user) => {
    if (accessDenied) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Error: Access denied, admin only",
        },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        showDeleteModal: true,
        userToDelete: user,
      },
    }));
  };

  const handleDelete = async () => {
    if (!state.modals.userToDelete) return;

    setState((prev) => ({ ...prev, deleting: true }));

    try {
      const result = await deleteUser(state.modals.userToDelete.id);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          // Remove the deleted user from the users array
          users: prev.users.filter(
            (user) => user.id !== state.modals.userToDelete.id
          ),
          alert: {
            type: "success",
            message: `User "${state.modals.userToDelete.name}" deleted successfully!`,
          },
          modals: {
            ...prev.modals,
            showDeleteModal: false,
            userToDelete: null,
          },
          deleting: false,
        }));

        // No need to refetch from server - user is already removed from state
      } else {
        setState((prev) => ({
          ...prev,
          alert: {
            type: "danger",
            message: result.message || "Failed to delete user",
          },
          modals: {
            ...prev.modals,
            showDeleteModal: false,
            userToDelete: null,
          },
          deleting: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Failed to delete user",
        },
        modals: {
          ...prev.modals,
          showDeleteModal: false,
          userToDelete: null,
        },
        deleting: false,
      }));
    }
  };

  const handleUserSubmit = async (values, { resetForm }) => {
    if (accessDenied) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Error: Access denied, admin only",
        },
      }));
      return;
    }

    const { id, ...userData } = values;
    try {
      const result = id
        ? await updateUser(id, userData)
        : await addUser(userData);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          modals: {
            ...prev.modals,
            showUserModal: false,
            selectedUser: null,
          },
          alert: {
            type: "success",
            message: id
              ? "User updated successfully!"
              : "User added successfully!",
          },
        }));

        // Refresh the users list
        await fetchUsers();
        resetForm();
      } else {
        setState((prev) => ({
          ...prev,
          alert: {
            type: "danger",
            message: result.message || "Failed to save user",
          },
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Failed to save user",
        },
      }));
    }
  };

  const setEditUser = (user) => {
    if (accessDenied) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Error: Access denied, admin only",
        },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        showUserModal: true,
        selectedUser: user,
      },
    }));
  };

  // Return access denied view if applicable - same structure as DashboardPage
  if (accessDenied) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <header className="content-header">
            <h2>Manage Users</h2>
          </header>
          <div className="content-body">
            <AccessDeniedAlert />
          </div>
        </main>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <header className="content-header">
            <h2>Manage Users</h2>
          </header>
          <div className="content-body text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </main>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <header className="content-header">
            <h2>Manage Users</h2>
          </header>
          <div className="content-body">
            <Alert variant="danger" className="mb-4">
              {state.error}
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="content-header">
          <h2>Manage Users</h2>
        </header>

        <div className="content-body">
          {state.alert && (
            <Alert
              variant={state.alert.type}
              onClose={() => setState((prev) => ({ ...prev, alert: null }))}
              dismissible
              className="mb-4"
            >
              {state.alert.message}
            </Alert>
          )}

          {/* Filter Card */}
          <Card className="filter-card mb-4">
            <Card.Body>
              <Row className="g-3 align-items-center">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FiSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="search"
                      placeholder="Search by name..."
                      value={state.search}
                      onChange={handleFilterChange}
                    />
                  </InputGroup>
                </Col>

                <Col md={4}>
                  <Form.Select
                    name="role"
                    value={state.role}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                  </Form.Select>
                </Col>

                <Col md={2} className="text-end">
                  <Button
                    variant="primary"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        modals: {
                          ...prev.modals,
                          showUserModal: true,
                          selectedUser: null,
                        },
                      }))
                    }
                  >
                    <FiPlus className="me-2" />
                    Add User
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="table-responsive">
            <Table striped hover className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  state.users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge
                          bg={user.role === "admin" ? "danger" : "primary"}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setEditUser(user)}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => showDeleteConfirmation(user)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        show={state.modals.showDeleteModal}
        onHide={() =>
          setState((prev) => ({
            ...prev,
            modals: {
              ...prev.modals,
              showDeleteModal: false,
              userToDelete: null,
            },
          }))
        }
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FiAlertTriangle className="me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">Are you sure you want to delete the user:</p>
          <div className="bg-light p-3 rounded">
            <strong>{state.modals.userToDelete?.name}</strong>
            <br />
            <small className="text-muted">
              {state.modals.userToDelete?.email}
            </small>
          </div>
          <p className="mt-3 mb-0 text-muted small">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                modals: {
                  ...prev.modals,
                  showDeleteModal: false,
                  userToDelete: null,
                },
              }))
            }
            disabled={state.deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={state.deleting}
          >
            {state.deleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 className="me-2" />
                Delete User
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit User Modal */}
      <Modal
        show={state.modals.showUserModal}
        onHide={() =>
          setState((prev) => ({
            ...prev,
            modals: {
              ...prev.modals,
              showUserModal: false,
              selectedUser: null,
            },
          }))
        }
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {state.modals.selectedUser ? "Edit User" : "Add User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              id: state.modals.selectedUser?.id || "",
              name: state.modals.selectedUser?.name || "",
              email: state.modals.selectedUser?.email || "",
              role: state.modals.selectedUser?.role || "cashier",
              password: "",
            }}
            validationSchema={Yup.object({
              name: Yup.string().required("Required"),
              email: Yup.string().email("Invalid email").required("Required"),
              role: Yup.string().required("Required"),
              password: state.modals.selectedUser
                ? Yup.string()
                : Yup.string().required("Required"),
            })}
            onSubmit={handleUserSubmit}
          >
            {({ errors, touched }) => (
              <FormikForm>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Field name="name" className="form-control" />
                  {errors.name && touched.name && (
                    <div className="text-danger small">{errors.name}</div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Field name="email" type="email" className="form-control" />
                  {errors.email && touched.email && (
                    <div className="text-danger small">{errors.email}</div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Field as="select" name="role" className="form-control">
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                  </Field>
                </Form.Group>

                {!state.modals.selectedUser && (
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Field
                      name="password"
                      type="password"
                      className="form-control"
                    />
                    {errors.password && touched.password && (
                      <div className="text-danger small">{errors.password}</div>
                    )}
                  </Form.Group>
                )}

                <div className="d-flex justify-content-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        modals: {
                          ...prev.modals,
                          showUserModal: false,
                        },
                      }))
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {state.modals.selectedUser ? "Update" : "Create"}
                  </Button>
                </div>
              </FormikForm>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UsersPage;
