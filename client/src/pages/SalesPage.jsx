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
  Container,
  OverlayTrigger,
  Tooltip,
  Dropdown,
  ButtonGroup,
} from "react-bootstrap";
import {
  FiTrash2,
  FiPlus,
  FiSearch,
  FiUser,
  FiCalendar,
  FiPercent,
  FiDollarSign,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiMoreHorizontal,
  FiCreditCard,
  FiShoppingCart,
  FiTrendingUp,
  FiBarChart2,
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
import "../styles/Sales.css";

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
  stats: {
    totalRevenue: 0,
    totalSales: 0,
    averageOrderValue: 0,
  },
};

const SalesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [state, setState] = useState(initialState);
  const [showFilters, setShowFilters] = useState(false);
  const [creatingSale, setCreatingSale] = useState(false);
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

  // Fetch all sales for stats calculation
  const fetchAllSalesForStats = useCallback(async () => {
    try {
      // Fetch all sales without pagination for stats calculation
      const response = await getSales({
        page: 1,
        limit: 10000, // Large number to get all sales
      });
      return response.sales || [];
    } catch (error) {
      console.error("Failed to fetch all sales for stats:", error);
      return [];
    }
  }, []);

  const calculateStats = (allSales) => {
    const totalRevenue = allSales.reduce(
      (sum, sale) => sum + parseFloat(sale.totalAmount || 0),
      0
    );
    const totalSales = allSales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    return { totalRevenue, totalSales, averageOrderValue };
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

        if (!response.sales || response.sales.length === 0) {
          setState((prev) => ({
            ...prev,
            alert: {
              type: "warning",
              message: `Sale #${appliedFilters.search.trim()} not found`,
            },
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

      if (error.response && error.response.status === 404) {
        setState((prev) => ({
          ...prev,
          alert: {
            type: "warning",
            message: "The requested sale was not found",
          },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          alert: {
            type: "danger",
            message: error.message || "Failed to load sales data",
          },
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

        const [products, salesData, cashiers, allSalesForStats] =
          await Promise.all([
            fetchProducts(),
            fetchSales(),
            fetchCashiers(),
            fetchAllSalesForStats(), // Fetch all sales for accurate stats
          ]);

        if (isMounted) {
          clearTimeout(timeoutId);
          const stats = calculateStats(allSalesForStats); // Use all sales for stats
          setState((prev) => ({
            ...prev,
            products,
            sales: salesData.sales || [],
            cashiers,
            loading: false,
            stats,
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
  }, [fetchProducts, fetchSales, fetchCashiers, fetchAllSalesForStats]);

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
      currentFilters: {
        ...prev.currentFilters,
        startDate: start,
        endDate: end,
      },
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
    setCreatingSale(true);
    try {
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

      // Refresh data after successful creation
      const [products, salesData, allSalesForStats] = await Promise.all([
        fetchProducts(),
        fetchSales(),
        fetchAllSalesForStats(),
      ]);

      const stats = calculateStats(allSalesForStats);
      setState((prev) => ({
        ...prev,
        products,
        sales: salesData.sales || [],
        stats,
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
        alert: { type: "danger", message: errorMessage },
      }));
    } finally {
      setCreatingSale(false);
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

        // Refresh data after successful deletion
        const [products, salesData, allSalesForStats] = await Promise.all([
          fetchProducts(),
          fetchSales(),
          fetchAllSalesForStats(),
        ]);

        const stats = calculateStats(allSalesForStats);
        setState((prev) => ({
          ...prev,
          products,
          sales: salesData.sales || [],
          stats,
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

  const getStatusBadge = (sale) => {
    const now = new Date();
    const saleDate = new Date(sale.date);
    const daysDiff = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return <Badge bg="success">Today</Badge>;
    if (daysDiff === 1) return <Badge bg="info">Yesterday</Badge>;
    if (daysDiff <= 7) return <Badge bg="warning">This Week</Badge>;
    return <Badge bg="secondary">Older</Badge>;
  };

  if (!hasAccess) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-0 text-gray-800">Sales Management</h1>
                <p className="text-muted mb-0">
                  Manage your sales transactions
                </p>
              </div>
            </div>
            <AccessDeniedAlert />
          </Container>
        </main>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-0 text-gray-800">Sales Management</h1>
                <p className="text-muted mb-0">
                  Manage your sales transactions
                </p>
              </div>
            </div>
            <Alert variant="danger" className="mb-4">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-1">Error Loading Data</h6>
                  <p className="mb-0">{state.error}</p>
                </div>
                <Button
                  variant="outline-danger"
                  onClick={() => window.location.reload()}
                  className="d-flex align-items-center gap-2"
                >
                  <FiRefreshCw size={16} />
                  Retry
                </Button>
              </div>
            </Alert>
          </Container>
        </main>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-0 text-gray-800">Sales Management</h1>
                <p className="text-muted mb-0">
                  Manage your sales transactions
                </p>
              </div>
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5 className="text-muted">Loading sales data...</h5>
              <p className="text-muted">Please wait while we fetch your data</p>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Container fluid className="py-4">
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0 text-gray-800">Sales Management</h1>
              <p className="text-muted mb-0">
                Monitor and manage your sales transactions
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                className="d-flex align-items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter size={16} />
                {showFilters ? "Hide Filters" : "Show Filters"}
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
                className="d-flex align-items-center gap-2"
              >
                <FiPlus size={16} />
                New Sale
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                        <FiDollarSign className="text-primary" size={24} />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <div className="text-muted small">Total Revenue</div>
                      <div className="h4 mb-0">
                        {formatCurrency(state.stats.totalRevenue)}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                        <FiShoppingCart className="text-success" size={24} />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <div className="text-muted small">Total Sales</div>
                      <div className="h4 mb-0">
                        {state.stats.totalSales.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                        <FiTrendingUp className="text-info" size={24} />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <div className="text-muted small">Avg. Order Value</div>
                      <div className="h4 mb-0">
                        {formatCurrency(state.stats.averageOrderValue)}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Alert Section */}
          {state.alert && (
            <Alert
              variant={state.alert.type}
              onClose={() => setState((prev) => ({ ...prev, alert: null }))}
              dismissible
              className="mb-4 border-0 shadow-sm"
            >
              {state.alert.message}
            </Alert>
          )}

          {/* Filters Section */}
          {showFilters && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light border-0">
                <h6 className="mb-0 d-flex align-items-center gap-2">
                  <FiFilter size={16} />
                  Filter Sales
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3 mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted mb-2">
                        Search Sales
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0">
                          <FiSearch className="text-muted" size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          ref={searchInputRef}
                          type="text"
                          name="search"
                          placeholder="Search by Sale ID..."
                          value={state.currentFilters.search}
                          onChange={handleFilterChange}
                          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                          className="border-start-0 bg-light"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted mb-2">
                        Date Range
                      </Form.Label>
                      <div className="input-group">
                        <DatePicker
                          selectsRange
                          startDate={state.currentFilters.startDate}
                          endDate={state.currentFilters.endDate}
                          onChange={handleDateChange}
                          isClearable
                          placeholderText="Select date range"
                          className="form-control bg-light"
                        />
                        <Button
                          variant="outline-secondary"
                          className="d-flex align-items-center justify-content-center"
                          style={{ width: "40px" }}
                          onClick={() =>
                            document
                              .querySelector(
                                ".react-datepicker__input-container input"
                              )
                              .focus()
                          }
                        >
                          <FiCalendar size={16} />
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted mb-2">
                        Cashier
                      </Form.Label>
                      <Form.Select
                        name="cashierId"
                        value={state.currentFilters.cashierId}
                        onChange={handleFilterChange}
                        className="bg-light"
                      >
                        <option value="">All Cashiers</option>
                        {state.cashiers.map((cashier) => (
                          <option key={cashier.id} value={cashier.id}>
                            {cashier.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted mb-2">
                        Amount Range
                      </Form.Label>
                      <Row className="g-2">
                        <Col>
                          <Form.Control
                            type="number"
                            name="minAmount"
                            placeholder="Min amount"
                            value={state.currentFilters.minAmount}
                            onChange={handleFilterChange}
                            className="bg-light"
                          />
                        </Col>
                        <Col>
                          <Form.Control
                            type="number"
                            name="maxAmount"
                            placeholder="Max amount"
                            value={state.currentFilters.maxAmount}
                            onChange={handleFilterChange}
                            className="bg-light"
                          />
                        </Col>
                      </Row>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={applyFilters}
                    className="d-flex align-items-center gap-2"
                  >
                    <FiSearch size={16} />
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={resetFilters}
                    className="d-flex align-items-center gap-2"
                  >
                    <FiRefreshCw size={16} />
                    Reset
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Sales Table */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 d-flex align-items-center gap-2">
                <FiBarChart2 size={16} />
                Sales Records
              </h6>
              <Badge bg="primary" className="fs-6">
                {state.pagination.totalSales} Total
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {state.sales.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FiShoppingCart size={48} />
                  </div>
                  <h5 className="text-muted">No sales found</h5>
                  <p className="text-muted mb-0">
                    {Object.values(state.appliedFilters).some((val) => val)
                      ? "Try adjusting your filters or search criteria"
                      : "Start by creating your first sale"}
                  </p>
                </div>
              ) : (
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 fw-semibold text-muted small px-4 py-3">
                        Sale ID
                      </th>
                      <th className="border-0 fw-semibold text-muted small px-4 py-3">
                        Date
                      </th>
                      <th className="border-0 fw-semibold text-muted small px-4 py-3">
                        Cashier
                      </th>
                      <th className="border-0 fw-semibold text-muted small px-4 py-3">
                        Amount
                      </th>
                      <th className="border-0 fw-semibold text-muted small px-4 py-3">
                        Status
                      </th>
                      <th className="border-0 fw-semibold text-muted small px-4 py-3 text-end">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.sales.map((sale) => (
                      <tr key={sale.id} className="border-bottom">
                        <td className="px-4 py-3">
                          <div className="fw-medium text-dark">#{sale.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-muted small">
                            {new Date(sale.date).toLocaleDateString()}
                          </div>
                          <div className="text-muted small">
                            {new Date(sale.date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                              <FiUser className="text-primary" size={14} />
                            </div>
                            <div>
                              <div className="fw-medium text-dark">
                                {sale.cashier?.name || "Unknown"}
                              </div>
                              <div className="text-muted small">
                                ID: {sale.cashier_id || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="fw-semibold text-success">
                            {formatCurrency(sale.totalAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(sale)}</td>
                        <td className="px-4 py-3 text-end">
                          <ButtonGroup>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>View Details</Tooltip>}
                            >
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewDetails(sale.id)}
                                className="d-flex align-items-center justify-content-center"
                                style={{ width: "36px", height: "36px" }}
                              >
                                <FiEye size={14} />
                              </Button>
                            </OverlayTrigger>
                            {canModify && (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Process Refund</Tooltip>}
                              >
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(sale.id)}
                                  className="d-flex align-items-center justify-content-center"
                                  style={{ width: "36px", height: "36px" }}
                                >
                                  <FiTrash2 size={14} />
                                </Button>
                              </OverlayTrigger>
                            )}
                          </ButtonGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* Pagination */}
          {state.pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={state.pagination.currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() =>
                    handlePageChange(state.pagination.currentPage - 1)
                  }
                  disabled={state.pagination.currentPage === 1}
                />

                {[...Array(state.pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === state.pagination.currentPage;

                  if (
                    page === 1 ||
                    page === state.pagination.totalPages ||
                    (page >= state.pagination.currentPage - 2 &&
                      page <= state.pagination.currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={page}
                        active={isCurrentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Pagination.Item>
                    );
                  } else if (
                    page === state.pagination.currentPage - 3 ||
                    page === state.pagination.currentPage + 3
                  ) {
                    return <Pagination.Ellipsis key={page} />;
                  }
                  return null;
                })}

                <Pagination.Next
                  onClick={() =>
                    handlePageChange(state.pagination.currentPage + 1)
                  }
                  disabled={
                    state.pagination.currentPage === state.pagination.totalPages
                  }
                />
                <Pagination.Last
                  onClick={() => handlePageChange(state.pagination.totalPages)}
                  disabled={
                    state.pagination.currentPage === state.pagination.totalPages
                  }
                />
              </Pagination>
            </div>
          )}
        </Container>
      </main>

      {/* New Sale Modal */}
      <Modal
        show={state.modals.showSaleModal}
        onHide={() =>
          setState((prev) => ({
            ...prev,
            modals: { ...prev.modals, showSaleModal: false },
          }))
        }
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FiPlus size={20} />
            Create New Sale
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-4">
            <Col md={8}>
              <Form.Group>
                <Form.Label className="fw-medium">Product</Form.Label>
                <Form.Select
                  value={state.modals.productIdInput}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      modals: {
                        ...prev.modals,
                        productIdInput: e.target.value,
                        selectedProduct: state.products.find(
                          (p) => p.id === parseInt(e.target.value)
                        ),
                      },
                    }))
                  }
                >
                  <option value="">Select a product...</option>
                  {state.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)} (Stock:{" "}
                      {product.stock})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-medium">Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={state.modals.quantity}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      modals: {
                        ...prev.modals,
                        quantity: parseInt(e.target.value) || 1,
                      },
                    }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-medium">&nbsp;</Form.Label>
                <Button
                  variant="success"
                  className="w-100"
                  onClick={() => {
                    if (state.modals.productIdInput) {
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
                  disabled={!state.modals.productIdInput}
                >
                  <FiPlus size={16} />
                </Button>
              </Form.Group>
            </Col>
          </Row>

          {/* Sale Items */}
          <div className="mb-4">
            <h6 className="fw-medium mb-3">Sale Items</h6>
            {state.modals.currentSaleItems.length === 0 ? (
              <div className="text-center py-4 bg-light rounded">
                <FiShoppingCart size={32} className="text-muted mb-2" />
                <p className="text-muted mb-0">No items added yet</p>
              </div>
            ) : (
              <Table responsive>
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.modals.currentSaleItems.map((item, index) => (
                    <tr key={index}>
                      <td className="fw-medium">{item.name}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            const updatedItems = [
                              ...state.modals.currentSaleItems,
                            ];
                            updatedItems[index].quantity = newQuantity;
                            setState((prev) => ({
                              ...prev,
                              modals: {
                                ...prev.modals,
                                currentSaleItems: updatedItems,
                              },
                            }));
                          }}
                          style={{ width: "80px" }}
                        />
                      </td>
                      <td className="fw-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveProductFromSale(index)}
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* Discount Section */}
          <div className="mb-4">
            <h6 className="fw-medium mb-3">Discount (Optional)</h6>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={state.modals.discountType}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        modals: {
                          ...prev.modals,
                          discountType: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Value</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
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
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Reason</Form.Label>
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
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Sale Summary */}
          <Card className="bg-light border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Subtotal:</span>
                <span className="fw-semibold">
                  {formatCurrency(currentSaleSubtotal)}
                </span>
              </div>
              {state.modals.discountValue > 0 && (
                <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                  <span>
                    Discount (
                    {state.modals.discountType === "percentage" ? "%" : "$"}):
                  </span>
                  <span>
                    -
                    {state.modals.discountType === "percentage"
                      ? `${state.modals.discountValue}%`
                      : formatCurrency(state.modals.discountValue)}
                  </span>
                </div>
              )}
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="h6 mb-0">Total:</span>
                <span className="h5 mb-0 text-success fw-bold">
                  {formatCurrency(currentSaleTotal)}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                modals: { ...prev.modals, showSaleModal: false },
              }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleCreateSale}
            disabled={
              state.modals.currentSaleItems.length === 0 || creatingSale
            }
            className="d-flex align-items-center gap-2"
          >
            <FiCreditCard size={16} />
            {creatingSale ? "Processing..." : "Complete Sale"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sale Details Modal */}
      <Modal
        show={state.modals.showDetailsModal}
        onHide={() =>
          setState((prev) => ({
            ...prev,
            modals: { ...prev.modals, showDetailsModal: false },
          }))
        }
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FiEye size={20} />
            Sale Details #{state.modals.selectedSale?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {state.modals.selectedSale && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="fw-medium mb-3">Sale Information</h6>
                      <div className="mb-2">
                        <strong>Sale ID:</strong> #
                        {state.modals.selectedSale.id}
                      </div>
                      <div className="mb-2">
                        <strong>Date:</strong>{" "}
                        {new Date(
                          state.modals.selectedSale.date
                        ).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <strong>Cashier:</strong>{" "}
                        {state.modals.selectedSale.cashier?.name || "Unknown"}
                      </div>
                      <div>
                        <strong>Total Amount:</strong>{" "}
                        <span className="text-success fw-bold">
                          {formatCurrency(
                            state.modals.selectedSale.totalAmount
                          )}
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="fw-medium mb-3">Payment Summary</h6>
                      <div className="mb-2">
                        <strong>Subtotal:</strong>{" "}
                        {formatCurrency(state.modals.selectedSale.subtotal)}
                      </div>
                      {state.modals.selectedSale.discountValue > 0 && (
                        <div className="mb-2 text-success">
                          <strong>Discount:</strong>{" "}
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
                        </div>
                      )}
                      <div className="text-success">
                        <strong>Final Total:</strong>{" "}
                        {formatCurrency(state.modals.selectedSale.totalAmount)}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h6 className="fw-medium mb-3">Items Purchased</h6>
              <Table responsive>
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {state.modals.selectedSale.saleItems?.map((item, index) => (
                    <tr key={index}>
                      <td className="fw-medium">
                        {item.product?.name || `Product ID: ${item.productId}`}
                      </td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{item.quantity}</td>
                      <td className="fw-semibold">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                modals: { ...prev.modals, showDetailsModal: false },
              }))
            }
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SalesPage;
