import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Row,
  Col,
  Card,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiShoppingCart,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { checkAccess, AccessDeniedAlert } from "../utils/auth";
import { getSalesReport } from "../services/dashBoardservice";
import "../styles/Dashboard.css";
import { format, parseISO } from "date-fns";

const DashboardPage = () => {
  const location = useLocation();
  const [screenSize, setScreenSize] = useState({
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth < 992,
  });

  const [state, setState] = useState({
    loading: true,
    error: null,
    alert: null,
    report: null, // Changed from pre-filled zeros to null
    filters: {
      period: "daily",
      startDate: null,
      endDate: null,
    },
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth < 992,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const hasAccess = checkAccess(["admin"]);

  useEffect(() => {
    if (state.alert) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, alert: null }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.alert]);

  const fetchReport = async () => {
    if (!hasAccess) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = { period: state.filters.period };
      
      if (state.filters.period === "custom" && state.filters.startDate && state.filters.endDate) {
        params.startDate = format(state.filters.startDate, "yyyy-MM-dd");
        params.endDate = format(state.filters.endDate, "yyyy-MM-dd");
      }

      const response = await getSalesReport(params);
      console.log("API Response:", response); // Debug log

      if (!response) throw new Error("Empty response from server");

      // Calculate salesByDay if not provided by backend
      const salesByDay = response.sales?.reduce((acc, sale) => {
        const date = sale.date ? format(parseISO(sale.date), "yyyy-MM-dd") : "unknown";
        acc[date] = (acc[date] || 0) + (Number(sale.totalAmount) || 0);
        return acc;
      }, {}) || {};

      setState((prev) => ({
        ...prev,
        report: {
          sales: response.sales || [],
          salesByDay: response.salesByDay || salesByDay,
          totalSales: response.totalSales || 0,
          totalRevenue: response.totalRevenue || 0,
          totalItemsSold: response.totalItemsSold || 0,
          discountsApplied: response.discountsApplied || 0,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("Fetch error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to fetch sales report",
        report: null,
      }));
    }
  };

  useEffect(() => {
    fetchReport();
  }, [state.filters.period, state.filters.startDate, state.filters.endDate, location.key]);

  const handlePeriodChange = (period) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        period,
        startDate: period === "custom" ? prev.filters.startDate : null,
        endDate: period === "custom" ? prev.filters.endDate : null,
      },
    }));
  };

  const handleDateChange = (e, dateType) => {
    const value = e.target.value ? new Date(e.target.value) : null;
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [dateType]: value,
      },
    }));
  };

  const handleExport = async () => {
    try {
      const params = {
        period: state.filters.period,
        format: "csv",
      };
      if (state.filters.startDate && state.filters.endDate) {
        params.startDate = format(state.filters.startDate, "yyyy-MM-dd");
        params.endDate = format(state.filters.endDate, "yyyy-MM-dd");
      }

      const response = await getSalesReport(params);
      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-report-${new Date().toISOString()}.csv`;
      link.click();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        alert: {
          type: "danger",
          message: "Failed to export report: " + error.message,
        },
      }));
    }
  };

  if (!hasAccess) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <header className="content-header">
            <h2>Sales Dashboard</h2>
          </header>
          <div className="content-body">
            <AccessDeniedAlert />
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
          <h2>Sales Dashboard</h2>
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
                <Col xs={12} md={screenSize.isTablet ? 12 : 4}>
                  <Form.Select
                    value={state.filters.period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                </Col>

                {state.filters.period === "custom" && (
                  <Col xs={12} md={screenSize.isTablet ? 12 : 6}>
                    <InputGroup>
                      <InputGroup.Text>
                        <FiCalendar />
                      </InputGroup.Text>
                      <Form.Control
                        type="date"
                        value={
                          state.filters.startDate
                            ? format(state.filters.startDate, "yyyy-MM-dd")
                            : ""
                        }
                        onChange={(e) => handleDateChange(e, "startDate")}
                      />
                      <Form.Control
                        type="date"
                        value={
                          state.filters.endDate
                            ? format(state.filters.endDate, "yyyy-MM-dd")
                            : ""
                        }
                        onChange={(e) => handleDateChange(e, "endDate")}
                        min={
                          state.filters.startDate
                            ? format(state.filters.startDate, "yyyy-MM-dd")
                            : undefined
                        }
                      />
                    </InputGroup>
                  </Col>
                )}

                <Col xs={12} md={screenSize.isTablet ? 12 : 2}>
                  <Button
                    variant="primary"
                    onClick={handleExport}
                    disabled={!state.report || state.report.totalSales === 0}
                    className="w-100"
                  >
                    <FiDownload className="me-2" />
                    {screenSize.isMobile ? "Export" : "Export CSV"}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {state.loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading dashboard data...</p>
            </div>
          ) : state.error ? (
            <Alert variant="danger" className="mb-4">
              {state.error}
              <Button
                variant="outline-danger"
                onClick={fetchReport}
                className="ms-3"
              >
                Retry
              </Button>
            </Alert>
          ) : state.report ? (
            <>
              {/* Summary Cards */}
              <Row className="g-3 mb-4">
                {[
                  {
                    icon: <FiShoppingCart size={screenSize.isMobile ? 20 : 24} />,
                    title: "Total Sales",
                    value: state.report.totalSales,
                    color: "primary",
                  },
                  {
                    icon: <FiDollarSign size={screenSize.isMobile ? 20 : 24} />,
                    title: "Total Revenue",
                    value: `$${state.report.totalRevenue.toFixed(2)}`,
                    color: "success",
                  },
                  {
                    icon: <FiShoppingCart size={screenSize.isMobile ? 20 : 24} />,
                    title: "Items Sold",
                    value: state.report.totalItemsSold,
                    color: "info",
                  },
                  {
                    icon: <FiDollarSign size={screenSize.isMobile ? 20 : 24} />,
                    title: "Discounts",
                    value: `$${state.report.discountsApplied.toFixed(2)}`,
                    color: "warning",
                  },
                ].map((metric, index) => (
                  <Col xs={6} md={3} key={index}>
                    <Card className="metric-card h-100">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className={`metric-icon bg-${metric.color}`}>
                            {metric.icon}
                          </div>
                          <div className="ms-3">
                            <h6 className="metric-title mb-1">{metric.title}</h6>
                            <h4 className="metric-value mb-0">{metric.value}</h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Sales Table */}
              <Card className="mb-4">
                <Card.Header>
                  <h5>Sales by Day</h5>
                </Card.Header>
                <Card.Body>
                  {Object.keys(state.report.salesByDay).length > 0 ? (
                    <div className="table-responsive">
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Sales</th>
                            <th>Revenue</th>
                            <th>Items</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(state.report.salesByDay).map(
                            ([date, revenue]) => {
                              const daySales = state.report.sales.filter(
                                (sale) =>
                                  sale.date &&
                                  format(parseISO(sale.date), "yyyy-MM-dd") === date
                              );
                              const itemsSold = daySales.reduce(
                                (sum, sale) =>
                                  sum +
                                  (sale.saleItems?.reduce(
                                    (s, item) => s + item.quantity,
                                    0
                                  ) || 0),
                                0
                              );

                              return (
                                <tr key={date}>
                                  <td>{date}</td>
                                  <td>{daySales.length}</td>
                                  <td>${Number(revenue).toFixed(2)}</td>
                                  <td>{itemsSold}</td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="info">No sales data available</Alert>
                  )}
                </Card.Body>
              </Card>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;