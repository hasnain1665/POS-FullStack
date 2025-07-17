import React, { useState, useEffect } from "react";
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
  Card,
  Pagination,
  InputGroup,
} from "react-bootstrap";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiPackage } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { Formik, Field, Form as FormikForm } from "formik";
import * as Yup from "yup";
import {
  getProducts,
  deleteProduct,
  updateProduct,
  addProduct as createProduct,
  getProductCategories as getCategories,
  restockProduct,
} from "../services/productService";
import Sidebar from "../components/Sidebar";
import { checkAccess, AccessDeniedAlert } from "../utils/auth";
import "../styles/Products.css";

const productSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  price: Yup.mixed()
    .test("is-number", "Price must be a number", (value) => !isNaN(value))
    .required("Price is required")
    .test("is-positive", "Price must be positive", (value) => value > 0),
  stock: Yup.number()
    .required("Stock is required")
    .integer("Stock must be integer")
    .min(1, "Stock must be at least 1"),
  category: Yup.string().required("Category is required"),
  description: Yup.string(),
});

const ProductsPage = () => {
  const location = useLocation();
  const [state, setState] = useState({
    products: [],
    loading: true,
    error: null,
    alert: null,
    categories: [],
    filters: {
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      minStock: "",
      maxStock: "",
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalProducts: 0,
      limit: 10,
    },
    modals: {
      showProductModal: false,
      showRestockModal: false,
      selectedProduct: null,
    },
  });

  // Check access first - returns boolean
  const hasAccess = checkAccess(["admin", "manager", "cashier"]);
  const canModify = checkAccess(["admin", "manager"]);

  // Auto-dismiss alert after 3 seconds
  useEffect(() => {
    if (state.alert) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, alert: null }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.alert]);

  const fetchProducts = async () => {
    // Don't fetch if access is denied
    if (!hasAccess) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    const { filters, pagination } = state;

    try {
      const response = await getProducts(
        filters.search,
        filters.category,
        filters.minPrice,
        filters.maxPrice,
        filters.minStock,
        filters.maxStock,
        pagination.currentPage,
        pagination.limit
      );

      setState((prev) => ({
        ...prev,
        products: response.products || [],
        loading: false,
        error: null,
        pagination: {
          ...prev.pagination,
          totalPages: response.totalPages || 1,
          totalProducts: response.totalProducts || 0,
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch products",
        products: [],
      }));
    }
  };

  const fetchCategories = async () => {
    try {
      const categories = await getCategories();
      setState((prev) => ({ ...prev, categories: categories || [] }));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [state.filters, state.pagination.currentPage, location.key]);

  // Return access denied view if applicable
  if (!hasAccess) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <header className="content-header">
            <h2>
              <FiPackage className="me-3" />
              Manage Products
            </h2>
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
            <h2>
              <FiPackage className="me-3" />
              Manage Products
            </h2>
          </header>
          <div className="content-body">
            <div className="text-center my-5">
              <Spinner
                animation="border"
                role="status"
                className="spinner-border"
              >
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3 text-muted">Loading products...</p>
            </div>
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
            <h2>
              <FiPackage className="me-3" />
              Manage Products
            </h2>
          </header>
          <div className="content-body">
            <Alert variant="danger" className="alert alert-danger">
              {state.error}
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  // Handler functions
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [name]: value,
      },
      pagination: {
        ...prev.pagination,
        currentPage: 1,
      },
    }));
  };

  const handlePageChange = (page) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        currentPage: page,
      },
    }));
  };

  const handleProductSubmit = async (values, { resetForm }) => {
    if (!canModify) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message:
            "Access denied - only admins and managers can modify products",
        },
      }));
      return;
    }

    const { id, ...productData } = values;
    try {
      const { success } = id
        ? await updateProduct(id, productData)
        : await createProduct(productData);

      if (success) {
        setState((prev) => ({
          ...prev,
          modals: {
            ...prev.modals,
            showProductModal: false,
            selectedProduct: null,
          },
          alert: {
            type: "success",
            message: id
              ? "Product updated successfully!"
              : "Product added successfully!",
          },
        }));
        fetchProducts();
        resetForm();
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Failed to save product",
        },
      }));
    }
  };

  const handleDelete = async (id) => {
    if (!canModify) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message:
            "Access denied - only admins and managers can delete products",
        },
      }));
      return;
    }

    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const { success, message } = await deleteProduct(id);
        if (success) {
          setState((prev) => ({
            ...prev,
            alert: {
              type: "success",
              message: "Product deleted successfully!",
            },
          }));
          fetchProducts();
        } else {
          setState((prev) => ({
            ...prev,
            alert: {
              type: "danger",
              message: message || "Failed to delete product",
            },
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          alert: {
            type: "danger",
            message: "An error occurred while deleting the product",
          },
        }));
      }
    }
  };

  const handleRestock = async (values, { resetForm }) => {
    if (!canModify) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message:
            "Access denied - only admins and managers can restock products",
        },
      }));
      return;
    }

    try {
      const { success } = await restockProduct(
        state.modals.selectedProduct.id,
        values.quantity
      );
      if (success) {
        setState((prev) => ({
          ...prev,
          modals: {
            ...prev.modals,
            showRestockModal: false,
            selectedProduct: null,
          },
          alert: {
            type: "success",
            message: "Product restocked successfully!",
          },
        }));
        fetchProducts();
        resetForm();
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Failed to restock product",
        },
      }));
    }
  };

  const setEditProduct = (product) => {
    if (!canModify) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Access denied - only admins and managers can edit products",
        },
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        showProductModal: true,
        selectedProduct: product,
      },
    }));
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="content-header">
          <h2>
            <FiPackage className="me-3" />
            Manage Products
          </h2>
        </header>

        <div className="content-body">
          {state.alert && (
            <Alert
              variant={state.alert.type}
              onClose={() => setState((prev) => ({ ...prev, alert: null }))}
              dismissible
              className={`alert alert-${state.alert.type}`}
            >
              {state.alert.message}
            </Alert>
          )}

          {/* Filter Card */}
          <Card className="filter-card mb-4">
            <Card.Body className="card-body">
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <InputGroup className="input-group">
                    <InputGroup.Text className="input-group-text">
                      <FiSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="search"
                      placeholder="Search products..."
                      value={state.filters.search}
                      onChange={handleFilterChange}
                      className="form-control"
                    />
                  </InputGroup>
                </Col>

                <Col md={3}>
                  <Form.Select
                    name="category"
                    value={state.filters.category}
                    onChange={handleFilterChange}
                    className="form-select"
                  >
                    <option value="">All Categories</option>
                    {state.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={5} className="text-end">
                  {canModify && (
                    <Button
                      variant="primary"
                      className="btn btn-primary"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          modals: {
                            ...prev.modals,
                            showProductModal: true,
                            selectedProduct: null,
                          },
                        }))
                      }
                    >
                      <FiPlus className="me-2" />
                      Add Product
                    </Button>
                  )}
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
                  <th className="text-end">Price</th>
                  <th>Category</th>
                  <th className="text-end">Stock</th>
                  {hasAccess && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {state.products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={hasAccess ? 6 : 5}
                      className="text-center py-4"
                    >
                      <div className="text-muted">
                        <FiPackage size={48} className="mb-3 opacity-50" />
                        <p>No products found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  state.products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td className="text-end">
                        $
                        {typeof product.price === "number"
                          ? product.price.toFixed(2)
                          : parseFloat(product.price || 0).toFixed(2)}
                      </td>
                      <td>
                        <Badge bg="secondary" className="badge text-capitalize">
                          {product.category}
                        </Badge>
                      </td>
                      <td
                        className={`text-end ${
                          product.stock <= 5 ? "text-warning fw-bold" : ""
                        }`}
                      >
                        {product.stock}
                        {product.stock <= 5 && (
                          <span className="ms-2 text-warning">⚠️</span>
                        )}
                      </td>
                      {hasAccess && (
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="btn btn-outline-primary"
                              onClick={() => setEditProduct(product)}
                              disabled={!canModify}
                            >
                              <FiEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(product.id)}
                              disabled={!canModify}
                            >
                              <FiTrash2 />
                            </Button>
                            {product.stock <= 5 && (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="btn btn-outline-warning"
                                onClick={() => {
                                  if (!canModify) {
                                    setState((prev) => ({
                                      ...prev,
                                      alert: {
                                        type: "danger",
                                        message:
                                          "Access denied - only admins and managers can restock products",
                                      },
                                    }));
                                    return;
                                  }
                                  setState((prev) => ({
                                    ...prev,
                                    modals: {
                                      ...prev.modals,
                                      showRestockModal: true,
                                      selectedProduct: product,
                                    },
                                  }));
                                }}
                                disabled={!canModify}
                              >
                                <FiPackage />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {state.pagination.totalPages > 1 && (
            <div className="pagination-wrapper">
              <Pagination className="pagination">
                <Pagination.Prev
                  disabled={state.pagination.currentPage === 1}
                  onClick={() =>
                    handlePageChange(state.pagination.currentPage - 1)
                  }
                />
                {Array.from({ length: state.pagination.totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === state.pagination.currentPage}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={
                    state.pagination.currentPage === state.pagination.totalPages
                  }
                  onClick={() =>
                    handlePageChange(state.pagination.currentPage + 1)
                  }
                />
              </Pagination>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Product Modal */}
      <Modal
        show={state.modals.showProductModal}
        onHide={() =>
          setState((prev) => ({
            ...prev,
            modals: {
              ...prev.modals,
              showProductModal: false,
              selectedProduct: null,
            },
          }))
        }
        centered
        className="modal"
      >
        <div className="modal-content">
          <Modal.Header closeButton className="modal-header">
            <Modal.Title className="modal-title">
              {state.modals.selectedProduct ? "Edit Product" : "Add Product"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body">
            <Formik
              initialValues={{
                id: state.modals.selectedProduct?.id || "",
                name: state.modals.selectedProduct?.name || "",
                price: state.modals.selectedProduct?.price || "",
                category: state.modals.selectedProduct?.category || "",
                stock: state.modals.selectedProduct?.stock || "",
                description: state.modals.selectedProduct?.description || "",
              }}
              validationSchema={productSchema}
              onSubmit={handleProductSubmit}
            >
              {({ errors, touched }) => (
                <FormikForm>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">Name</Form.Label>
                    <Field name="name" className="form-control" />
                    {errors.name && touched.name && (
                      <div className="text-danger">{errors.name}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">Price</Form.Label>
                    <Field
                      name="price"
                      type="number"
                      step="0.01"
                      className="form-control"
                    />
                    {errors.price && touched.price && (
                      <div className="text-danger">{errors.price}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">Category</Form.Label>
                    <Field as="select" name="category" className="form-select">
                      <option value="">Select category</option>
                      {state.categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Field>
                    {errors.category && touched.category && (
                      <div className="text-danger">{errors.category}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">Stock</Form.Label>
                    <Field
                      name="stock"
                      type="number"
                      className="form-control"
                    />
                    {errors.stock && touched.stock && (
                      <div className="text-danger">{errors.stock}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">Description</Form.Label>
                    <Field
                      as="textarea"
                      name="description"
                      className="form-control"
                      rows={3}
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      className="btn btn-secondary"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          modals: {
                            ...prev.modals,
                            showProductModal: false,
                          },
                        }))
                      }
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="btn btn-primary"
                    >
                      {state.modals.selectedProduct ? "Update" : "Create"}
                    </Button>
                  </div>
                </FormikForm>
              )}
            </Formik>
          </Modal.Body>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal
        show={state.modals.showRestockModal}
        onHide={() =>
          setState((prev) => ({
            ...prev,
            modals: {
              ...prev.modals,
              showRestockModal: false,
            },
          }))
        }
        centered
        size="sm"
        className="modal"
      >
        <div className="modal-content">
          <Modal.Header closeButton className="modal-header">
            <Modal.Title className="modal-title">Restock Product</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body">
            <Formik
              initialValues={{ quantity: 1 }}
              validationSchema={Yup.object({
                quantity: Yup.number()
                  .required("Required")
                  .integer("Must be integer")
                  .min(1, "Must be at least 1"),
              })}
              onSubmit={handleRestock}
            >
              {({ errors, touched }) => (
                <FormikForm>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">Product</Form.Label>
                    <Form.Control
                      type="text"
                      value={state.modals.selectedProduct?.name}
                      readOnly
                      className="form-control"
                    />
                  </Form.Group>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">
                      Current Stock
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={state.modals.selectedProduct?.stock}
                      readOnly
                      className="form-control"
                    />
                  </Form.Group>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="form-label">
                      Quantity to Add
                    </Form.Label>
                    <Field
                      name="quantity"
                      type="number"
                      className="form-control"
                    />
                    {errors.quantity && touched.quantity && (
                      <div className="text-danger">{errors.quantity}</div>
                    )}
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      className="btn btn-secondary"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          modals: {
                            ...prev.modals,
                            showRestockModal: false,
                          },
                        }))
                      }
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="btn btn-primary"
                    >
                      Restock
                    </Button>
                  </div>
                </FormikForm>
              )}
            </Formik>
          </Modal.Body>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
