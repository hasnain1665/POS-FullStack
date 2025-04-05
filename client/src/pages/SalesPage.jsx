import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  Form,
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
import {
  FiTrash2,
  FiPlus,
  FiSearch,
  FiUser,
  FiCalendar,
  FiPercent,
  FiDollarSign,
} from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { checkAccess, AccessDeniedAlert } from "../utils/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  getSales,
  createSale,
  deleteSale,
  getSaleDetails,
  extractCashiersFromSales,
} from "../services/salesService";
import { getProducts } from "../services/productService";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
};

const initialState = {
  sales: [],
  loading: true,
  error: null,
  alert: null,
  products: [],
  cashiers: [],
  currentFilters: {
    search: "",
    startDate: null,
    endDate: null,
    minAmount: "",
    maxAmount: "",
    cashierId: "",
  },
  appliedFilters: {
    search: "",
    startDate: null,
    endDate: null,
    minAmount: "",
    maxAmount: "",
    cashierId: "",
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalSales: 0,
    limit: 10,
  },
  modals: {
    showSaleModal: false,
    showDetailsModal: false,
    selectedSale: null,
    currentSaleItems: [],
    productIdInput: "",
    selectedProduct: null,
    quantity: 1,
    discountType: "percentage",
    discountValue: 0,
    discountReason: "",
  },
};

const SalesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [state, setState] = useState(initialState);
  const searchInputRef = useRef(null);
  const hasAccess = checkAccess(["admin", "manager", "cashier"]);
  const canModify = checkAccess(["admin", "manager"]);

  const calculateDiscountedTotal = (items, discountType, discountValue) => {
    const subtotal = items.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 0),
      0
    );
    if (discountType === "percentage") {
      return subtotal * (1 - (discountValue || 0) / 100);
    }
    return Math.max(0, subtotal - (discountValue || 0));
  };

  const fetchProducts = useCallback(async () => {
    try {
      const response = await getProducts("", "", "", "", "", "", 1, 1000);
      return response.products || [];
    } catch (error) {
      console.error("Failed to fetch products:", error);
      throw error;
    }
  }, []);

  const fetchCashiers = useCallback(async () => {
    try {
      const response = await extractCashiersFromSales();
      const cashiers = response.cashiers || [];

      const uniqueCashiers = cashiers.reduce((acc, current) => {
        const x = acc.find((item) => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      return uniqueCashiers;
    } catch (error) {
      console.error("Failed to fetch cashiers:", error);
      throw error;
    }
  }, []);

  const fetchSales = useCallback(async () => {
    if (!hasAccess) return { sales: [], totalPages: 1, totalSales: 0 };
  
    const { appliedFilters, pagination } = state;
    try {
      const isSaleIdSearch = /^\d+$/.test(appliedFilters.search.trim());
  
      if (isSaleIdSearch) {
        const response = await getSales({
          saleId: appliedFilters.search.trim(),
          page: pagination.currentPage,
          limit: pagination.limit,
        });
  
        // If no sales are found for the specific ID search
        if (!response.sales || response.sales.length === 0) {
          setState(prev => ({
            ...prev,
            alert: {
              type: "warning",
              message: `Sale #${appliedFilters.search.trim()} not found`
            }
          }));
          return { sales: [], totalPages: 1, totalSales: 0 };
        }
  
        return response;
      }
  
      return await getSales({
        startDate: appliedFilters.startDate?.toISOString(),
        endDate: appliedFilters.endDate?.toISOString(),
        minAmount: appliedFilters.minAmount,
        maxAmount: appliedFilters.maxAmount,
        cashierId: appliedFilters.cashierId,
        page: pagination.currentPage,
        limit: pagination.limit,
      });
    } catch (error) {
      console.error("Error fetching sales:", error);
      
      // Handle 404 errors specifically
      if (error.response && error.response.status === 404) {
        setState(prev => ({
          ...prev,
          alert: {
            type: "warning",
            message: "The requested sale was not found"
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          alert: {
            type: "danger",
            message: error.message || "Failed to load sales data"
          }
        }));
      }
      
      throw error;
    }
  }, [state.appliedFilters, state.pagination.currentPage, hasAccess]);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Request timed out. Please try again.",
        }));
      }
    }, 15000);

    const loadData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const [products, salesData, cashiers] = await Promise.all([
          fetchProducts(),
          fetchSales(),
          fetchCashiers(),
        ]);

        if (isMounted) {
          clearTimeout(timeoutId);
          setState((prev) => ({
            ...prev,
            products,
            sales: salesData.sales || [],
            cashiers,
            loading: false,
            pagination: {
              ...prev.pagination,
              totalPages: salesData.totalPages || 1,
              totalSales: salesData.totalSales || 0,
            },
          }));
        }
      } catch (error) {
        if (isMounted) {
          clearTimeout(timeoutId);

          if (error.message && error.message.includes("not found")) {
            setState((prev) => ({
              ...prev,
              loading: false,
              sales: [],
              alert: {
                type: "warning",
                message: error.message,
              },
              pagination: {
                ...prev.pagination,
                totalPages: 1,
                totalSales: 0,
              },
            }));
          } else {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: error.message || "Failed to load data",
            }));
          }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchProducts, fetchSales, fetchCashiers]);

  useEffect(() => {
    if (state.alert) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, alert: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.alert]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      currentFilters: { ...prev.currentFilters, [name]: value },
    }));
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setState((prev) => ({
      ...prev,
      currentFilters: { ...prev.currentFilters, startDate: start, endDate: end },
    }));
  };

  const handlePageChange = (page) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page },
    }));
  };

  const handleAddProductToSale = (productId, quantity) => {
    const product = state.products.find((p) => p.id === parseInt(productId));
    if (!product) return;

    const existingItemIndex = state.modals.currentSaleItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...state.modals.currentSaleItems];
      updatedItems[existingItemIndex].quantity += parseInt(quantity || 1);
      setState((prev) => ({
        ...prev,
        modals: {
          ...prev.modals,
          currentSaleItems: updatedItems,
        },
      }));
    } else {
      setState((prev) => ({
        ...prev,
        modals: {
          ...prev.modals,
          currentSaleItems: [
            ...prev.modals.currentSaleItems,
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: parseInt(quantity || 1),
            },
          ],
        },
      }));
    }
  };

  const handleRemoveProductFromSale = (index) => {
    const updatedItems = [...state.modals.currentSaleItems];
    updatedItems.splice(index, 1);
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        currentSaleItems: updatedItems,
      },
    }));
  };

  const handleCreateSale = async () => {
    if (state.modals.currentSaleItems.length === 0) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Please add at least one item to the sale",
        },
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));

      const saleData = {
        items: state.modals.currentSaleItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        ...(state.modals.discountValue > 0 && {
          discount: {
            type: state.modals.discountType,
            value: state.modals.discountValue,
            reason: state.modals.discountReason,
          },
        }),
      };

      const response = await createSale(saleData);

      setState((prev) => ({
        ...prev,
        loading: false,
        alert: { type: "success", message: "Sale created successfully!" },
        modals: {
          ...prev.modals,
          showSaleModal: false,
          currentSaleItems: [],
          discountType: "percentage",
          discountValue: 0,
          discountReason: "",
        },
      }));

      const [products, salesData] = await Promise.all([
        fetchProducts(),
        fetchSales(),
      ]);

      setState((prev) => ({
        ...prev,
        products,
        sales: salesData.sales || [],
        pagination: {
          ...prev.pagination,
          totalPages: salesData.totalPages || 1,
          totalSales: salesData.totalSales || 0,
        },
      }));
    } catch (error) {
      let errorMessage = "Failed to create sale";
      if (error.response) {
        if (error.response.data.errors) {
          errorMessage = error.response.data.errors
            .map((err) => err.msg)
            .join(", ");
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        alert: { type: "danger", message: errorMessage },
      }));
    }
  };

  const handleDelete = async (saleId) => {
    if (!canModify) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message:
            "Access denied - only admins and managers can process refunds",
        },
      }));
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to process this refund? This will restore product stock."
      )
    ) {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await deleteSale(saleId);
        const restoredItems = response.restoredItems || [];
        const success = response.success !== false;

        setState((prev) => ({
          ...prev,
          loading: false,
          alert: {
            type: success ? "success" : "danger",
            message: (
              <div>
                <p>
                  {response.message ||
                    (success
                      ? "Refund processed successfully!"
                      : "Failed to process refund")}
                </p>
                {restoredItems.length > 0 && (
                  <ul className="mt-2">
                    {restoredItems.map((item, index) => (
                      <li key={index}>
                        Restored {item.quantity} ×{" "}
                        {item.productName || `Product ID: ${item.productId}`}
                        {item.price
                          ? ` (${formatCurrency(item.price)} each)`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ),
          },
        }));

        const [products, salesData] = await Promise.all([
          fetchProducts(),
          fetchSales(),
        ]);

        setState((prev) => ({
          ...prev,
          products,
          sales: salesData.sales || [],
          pagination: {
            ...prev.pagination,
            totalPages: salesData.totalPages || 1,
            totalSales: salesData.totalSales || 0,
          },
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          alert: {
            type: "danger",
            message: "An error occurred while processing the refund",
          },
        }));
      }
    }
  };

  const handleViewDetails = async (saleId) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await getSaleDetails(saleId);

      const saleData = response.sale || response.data || response;

      if (!saleData) {
        throw new Error("No sale data received");
      }

      const items = saleData.saleItems || saleData.items || [];
      const subtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.product?.price || item.unitPrice || 0);
        const quantity = parseInt(item.quantity || 0);
        return sum + price * quantity;
      }, 0);

      const validatedSale = {
        id: saleData.id || saleId,
        date: saleData.date || new Date().toISOString(),
        cashier_id: saleData.cashier_id || saleData.cashierId || null,
        cashier: saleData.cashier || null,
        saleItems: items.map((item) => ({
          ...item,
          unitPrice: parseFloat(item.product?.price || item.unitPrice || 0),
          quantity: parseInt(item.quantity || 0),
          productId: item.productId,
          product: item.product || { name: `Product ID: ${item.productId}` },
        })),
        subtotal: subtotal,
        totalAmount: parseFloat(
          saleData.totalAmount || saleData.total || subtotal
        ),
        discountType: saleData.discountType || "percentage",
        discountValue: parseFloat(saleData.discountValue || 0),
        discountReason: saleData.discountReason || "",
      };

      setState((prev) => ({
        ...prev,
        loading: false,
        modals: {
          ...prev.modals,
          showDetailsModal: true,
          selectedSale: validatedSale,
        },
      }));
    } catch (error) {
      console.error("Error loading sale details:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        alert: {
          type: "danger",
          message:
            "Failed to load sale details: " +
            (error.message || "Invalid sale data"),
        },
      }));
    }
  };

  const applyFilters = () => {
    setState((prev) => ({
      ...prev,
      appliedFilters: { ...prev.currentFilters },
      pagination: { ...prev.pagination, currentPage: 1 },
      loading: true,
      alert: null,
    }));
  };

  const resetFilters = () => {
    setState((prev) => ({
      ...prev,
      currentFilters: { ...initialState.currentFilters },
      appliedFilters: { ...initialState.appliedFilters },
      pagination: { ...prev.pagination, currentPage: 1 },
    }));
  };

  const currentSaleSubtotal = state.modals.currentSaleItems.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 0),
    0
  );

  const currentSaleTotal = calculateDiscountedTotal(
    state.modals.currentSaleItems,
    state.modals.discountType,
    state.modals.discountValue
  );

  if (!hasAccess) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <header className="content-header">
            <h2>Manage Sales</h2>
          </header>
          <div className="content-body">
            <AccessDeniedAlert />
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
            <h2>Manage Sales</h2>
          </header>
          <div className="content-body">
            <Alert variant="danger" className="mb-4">
              {state.error}
              <Button
                variant="outline-danger"
                className="ms-3"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Alert>
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
            <h2>Manage Sales</h2>
          </header>
          <div className="content-body text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading sales data...</p>
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
          <h2>Manage Sales</h2>
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

          <Card className="filter-card mb-4">
            <Card.Body className="p-3">
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <Form.Group controlId="searchSales">
                    <Form.Label className="small text-muted mb-1">
                      Search Sales
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white">
                        <FiSearch className="text-secondary" />
                      </InputGroup.Text>
                      <Form.Control
                        ref={searchInputRef}
                        type="text"
                        name="search"
                        placeholder="Search by Sale ID..."
                        value={state.currentFilters.search}
                        onChange={handleFilterChange}
                        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                        className="border-start-0"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="dateRange">
                    <Form.Label className="small text-muted mb-1">
                      Date Range
                    </Form.Label>
                    <div className="d-flex align-items-center">
                      <DatePicker
                        selectsRange
                        startDate={state.currentFilters.startDate}
                        endDate={state.currentFilters.endDate}
                        onChange={handleDateChange}
                        isClearable
                        placeholderText="Select date range"
                        className="form-control flex-grow-1"
                      />
                      <Button
                        variant="outline-secondary"
                        className="ms-2 d-flex align-items-center"
                        style={{ height: "38px", width: "38px" }}
                        onClick={() =>
                          document
                            .querySelector(
                              ".react-datepicker__input-container input"
                            )
                            ?.focus()
                        }
                      >
                        <FiCalendar className="text-secondary" />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="amountRange">
                    <Form.Label className="small text-muted mb-1">
                      Amount Range ($)
                    </Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="number"
                        name="minAmount"
                        placeholder="Min amount"
                        value={state.currentFilters.minAmount}
                        onChange={handleFilterChange}
                        min="0"
                        step="0.01"
                      />
                      <Form.Control
                        type="number"
                        name="maxAmount"
                        placeholder="Max amount"
                        value={state.currentFilters.maxAmount}
                        onChange={handleFilterChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 align-items-end">
                {user.role === "admin" && (
                  <Col md={4}>
                    <Form.Group controlId="cashierFilter">
                      <Form.Label className="small text-muted mb-1">
                        Filter by Cashier
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white">
                          <FiUser className="text-secondary" />
                        </InputGroup.Text>
                        <Form.Select
                          name="cashierId"
                          value={state.currentFilters.cashierId}
                          onChange={handleFilterChange}
                          className="border-start-0"
                        >
                          <option value="">All Cashiers</option>
                          {state.cashiers.map((cashier) => (
                            <option key={cashier.id} value={cashier.id}>
                              {cashier.name}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                )}

                <Col md={user.role === "admin" ? 8 : 12}>
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={resetFilters}
                      className="px-4"
                    >
                      Reset
                    </Button>
                    <Button
                      variant="primary"
                      onClick={applyFilters}
                      className="px-4"
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="success"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          modals: {
                            ...prev.modals,
                            showSaleModal: true,
                            currentSaleItems: [],
                          },
                        }))
                      }
                      disabled={state.products.length === 0}
                      className="d-flex align-items-center gap-1 px-4"
                    >
                      <FiPlus size={18} />
                      <span>New Sale</span>
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="table-responsive">
            <Table striped hover className="sales-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date</th>
                  <th>Cashier</th>
                  <th>Items</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No sales found
                    </td>
                  </tr>
                ) : (
                  state.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.id}</td>
                      <td>{new Date(sale.date).toLocaleString()}</td>
                      <td>
                        {sale.cashier?.name ||
                          state.cashiers.find((c) => c.id === sale.cashier_id)
                            ?.name ||
                          `Cashier #${sale.cashier_id}`}
                        {sale.cashier_id === user.id && (
                          <Badge bg="info" className="ms-2">
                            You
                          </Badge>
                        )}
                      </td>
                      <td>
                        {sale.saleItems?.length || 0} items
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleViewDetails(sale.id)}
                          className="p-0 ms-2"
                        >
                          View
                        </Button>
                      </td>
                      <td className="text-end">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(sale.id)}
                            disabled={!canModify}
                            title={
                              !canModify
                                ? "Requires admin/manager access"
                                : "Process refund"
                            }
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

          {state.pagination.totalPages > 1 && (
            <div className="pagination-wrapper">
              <Pagination>
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

        {/* New Sale Modal */}
        <Modal
          show={state.modals.showSaleModal}
          onHide={() =>
            setState((prev) => ({
              ...prev,
              modals: {
                ...prev.modals,
                showSaleModal: false,
                currentSaleItems: [],
                discountType: "percentage",
                discountValue: 0,
                discountReason: "",
              },
            }))
          }
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Sale</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <h5>Add Products</h5>
                <div className="mb-3">
                  <Form.Label>Product ID</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter Product ID"
                    value={state.modals.productIdInput}
                    onChange={(e) => {
                      const productId = e.target.value;
                      const product = state.products.find(
                        (p) => p.id === parseInt(productId)
                      );
                      setState((prev) => ({
                        ...prev,
                        modals: {
                          ...prev.modals,
                          productIdInput: productId,
                          selectedProduct: product || null,
                        },
                      }));
                    }}
                    min="1"
                  />
                </div>

                {state.modals.selectedProduct && (
                  <div className="product-details mb-3 p-3 bg-light rounded">
                    <h6>{state.modals.selectedProduct.name}</h6>
                    <p>
                      Price:{" "}
                      {formatCurrency(state.modals.selectedProduct.price)}
                    </p>
                    <p>Stock: {state.modals.selectedProduct.stock}</p>
                  </div>
                )}

                <div className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={state.modals.selectedProduct?.stock || 1}
                    value={state.modals.quantity}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        modals: {
                          ...prev.modals,
                          quantity: Math.min(
                            parseInt(e.target.value || 1),
                            state.modals.selectedProduct?.stock || Infinity
                          ),
                        },
                      }))
                    }
                    placeholder="Quantity"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (state.modals.selectedProduct) {
                      handleAddProductToSale(
                        state.modals.productIdInput,
                        state.modals.quantity
                      );
                      setState((prev) => ({
                        ...prev,
                        modals: {
                          ...prev.modals,
                          productIdInput: "",
                          selectedProduct: null,
                          quantity: 1,
                        },
                      }));
                    }
                  }}
                  disabled={!state.modals.selectedProduct}
                >
                  Add to Sale
                </Button>
              </Col>
              <Col md={6}>
                <h5>Current Sale</h5>
                {state.modals.currentSaleItems.length === 0 ? (
                  <p className="text-muted">No items added yet</p>
                ) : (
                  <div className="sale-items-list">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Qty</th>
                          <th>Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.modals.currentSaleItems.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>{item.quantity}</td>
                            <td>
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger p-0"
                                onClick={() =>
                                  handleRemoveProductFromSale(index)
                                }
                                title="Remove item"
                              >
                                <FiTrash2 />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="discount-controls mb-3">
                      <h6>Discount</h6>
                      <div className="mb-2">
                        <Form.Check
                          inline
                          type="radio"
                          label="Percentage"
                          name="discountType"
                          checked={state.modals.discountType === "percentage"}
                          onChange={() =>
                            setState((prev) => ({
                              ...prev,
                              modals: {
                                ...prev.modals,
                                discountType: "percentage",
                              },
                            }))
                          }
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Fixed Amount"
                          name="discountType"
                          checked={state.modals.discountType === "fixed"}
                          onChange={() =>
                            setState((prev) => ({
                              ...prev,
                              modals: {
                                ...prev.modals,
                                discountType: "fixed",
                              },
                            }))
                          }
                        />
                      </div>

                      <InputGroup className="mb-2">
                        <Form.Control
                          type="number"
                          min="0"
                          max={
                            state.modals.discountType === "percentage"
                              ? 100
                              : undefined
                          }
                          value={state.modals.discountValue}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              modals: {
                                ...prev.modals,
                                discountValue: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          placeholder={
                            state.modals.discountType === "percentage"
                              ? "0-100%"
                              : "Amount"
                          }
                        />
                        <InputGroup.Text>
                          {state.modals.discountType === "percentage" ? (
                            <FiPercent />
                          ) : (
                            <FiDollarSign />
                          )}
                        </InputGroup.Text>
                      </InputGroup>

                      <Form.Control
                        type="text"
                        placeholder="Discount reason (optional)"
                        value={state.modals.discountReason}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            modals: {
                              ...prev.modals,
                              discountReason: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="text-end mt-3">
                      <h5>Subtotal: {formatCurrency(currentSaleSubtotal)}</h5>
                      {state.modals.discountValue > 0 && (
                        <>
                          <h5 className="text-danger">
                            Discount:{" "}
                            {state.modals.discountType === "percentage"
                              ? `${state.modals.discountValue}%`
                              : formatCurrency(state.modals.discountValue)}
                          </h5>
                          <h4>Total: {formatCurrency(currentSaleTotal)}</h4>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  modals: {
                    ...prev.modals,
                    showSaleModal: false,
                    currentSaleItems: [],
                    discountType: "percentage",
                    discountValue: 0,
                    discountReason: "",
                  },
                }))
              }
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSale}
              disabled={state.modals.currentSaleItems.length === 0}
            >
              Complete Sale
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Sale Details Modal */}
        <Modal
          show={state.modals.showDetailsModal}
          onHide={() =>
            setState((prev) => ({
              ...prev,
              modals: {
                ...prev.modals,
                showDetailsModal: false,
                selectedSale: null,
              },
            }))
          }
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Sale Details #{state.modals.selectedSale?.id}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {state.modals.selectedSale ? (
              <>
                <div className="mb-4">
                  <Row>
                    <Col md={6}>
                      <p>
                        <strong>Date:</strong>{" "}
                        {state.modals.selectedSale.date
                          ? new Date(
                              state.modals.selectedSale.date
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Cashier:</strong>{" "}
                        {state.modals.selectedSale.cashier?.name ||
                          state.cashiers.find(
                            (c) => c.id === state.modals.selectedSale.cashier_id
                          )?.name ||
                          (state.modals.selectedSale.cashier_id
                            ? `Cashier #${state.modals.selectedSale.cashier_id}`
                            : "N/A")}
                      </p>
                    </Col>
                    <Col md={6} className="text-end">
                      <h5>
                        Subtotal:{" "}
                        {formatCurrency(state.modals.selectedSale.subtotal)}
                      </h5>
                      {state.modals.selectedSale.discountValue > 0 && (
                        <h5 className="text-danger">
                          Discount:{" "}
                          {state.modals.selectedSale.discountType ===
                          "percentage"
                            ? `${state.modals.selectedSale.discountValue}%`
                            : formatCurrency(
                                state.modals.selectedSale.discountValue
                              )}
                          {state.modals.selectedSale.discountReason && (
                            <small className="d-block text-muted">
                              Reason: {state.modals.selectedSale.discountReason}
                            </small>
                          )}
                        </h5>
                      )}
                      <h4>
                        Total:{" "}
                        {formatCurrency(state.modals.selectedSale.totalAmount)}
                      </h4>
                    </Col>
                  </Row>
                </div>

                <h5>Items</h5>
                {state.modals.selectedSale.saleItems?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Qty</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.modals.selectedSale.saleItems.map(
                          (item, index) => {
                            const price = parseFloat(
                              item.unitPrice || item.price || 0
                            );
                            const quantity = parseInt(item.quantity || 0);
                            const itemSubtotal = price * quantity;

                            return (
                              <tr key={index}>
                                <td>
                                  {item.product?.name ||
                                    `Product ID: ${item.productId}`}
                                </td>
                                <td>{formatCurrency(price)}</td>
                                <td>{quantity}</td>
                                <td>{formatCurrency(itemSubtotal)}</td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No items found for this sale</p>
                )}
              </>
            ) : (
              <Alert variant="warning">No sale data available</Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  modals: {
                    ...prev.modals,
                    showDetailsModal: false,
                    selectedSale: null,
                  },
                }))
              }
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </main>
    </div>
  );
};

export default SalesPage;