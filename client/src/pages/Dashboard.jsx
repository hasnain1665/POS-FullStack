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
  Badge,
} from "react-bootstrap";
import {
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
  FiFilter,
  FiRefreshCw,
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
    report: {
      sales: [],
      salesByDay: {},
      totalSales: 0,
      totalRevenue: 0,
      totalItemsSold: 0,
      discountsApplied: 0,
    },
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

      if (
        state.filters.period === "custom" &&
        state.filters.startDate &&
        state.filters.endDate
      ) {
        params.startDate = format(state.filters.startDate, "yyyy-MM-dd");
        params.endDate = format(state.filters.endDate, "yyyy-MM-dd");
      }

      const response = await getSalesReport(params);
      console.log("API Response:", response);

      if (!response) throw new Error("Empty response from server");

      const salesByDay =
        response.sales?.reduce((acc, sale) => {
          const date = sale.date
            ? format(parseISO(sale.date), "yyyy-MM-dd")
            : "unknown";
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
  }, [
    state.filters.period,
    state.filters.startDate,
    state.filters.endDate,
    location.key,
  ]);

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
    if (state.report.totalSales === 0) return;
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
            <div className="header-content">
              <div className="header-text">
                <h1 className="dashboard-title">Sales Dashboard</h1>
                <p className="dashboard-subtitle">
                  Monitor your sales performance
                </p>
              </div>
            </div>
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
          <div className="header-content">
            <div className="header-text">
              <h1 className="dashboard-title">Sales Dashboard</h1>
              <p className="dashboard-subtitle">
                Monitor your sales performance and analytics
              </p>
            </div>
            <div className="header-actions">
              <Button
                variant="outline-primary"
                onClick={fetchReport}
                disabled={state.loading}
                size="sm"
                className="refresh-btn"
              >
                <FiRefreshCw className={state.loading ? "spinning" : ""} />
                {!screenSize.isMobile && " Refresh"}
              </Button>
            </div>
          </div>
        </header>

        <div className="content-body">
          {state.alert && (
            <Alert
              variant={state.alert.type}
              onClose={() => setState((prev) => ({ ...prev, alert: null }))}
              dismissible
              className="dashboard-alert"
            >
              {state.alert.message}
            </Alert>
          )}

          {/* Filter Card */}
          <Card className="filter-card">
            <Card.Body>
              <div className="filter-header">
                <h6 className="filter-title">
                  <FiFilter className="me-2" />
                  Filters & Export
                </h6>
              </div>
              <Row className="g-3 align-items-end">
                <Col xs={12} md={screenSize.isTablet ? 12 : 4}>
                  <Form.Label className="form-label">Period</Form.Label>
                  <Form.Select
                    value={state.filters.period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="form-select-custom"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                </Col>

                {state.filters.period === "custom" && (
                  <Col xs={12} md={screenSize.isTablet ? 12 : 6}>
                    <Form.Label className="form-label">Date Range</Form.Label>
                    <InputGroup className="date-range-input">
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
                        className="form-control-custom"
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
                        className="form-control-custom"
                      />
                    </InputGroup>
                  </Col>
                )}

                <Col xs={12} md={screenSize.isTablet ? 12 : 2}>
                  <Button
                    variant="primary"
                    onClick={handleExport}
                    className="export-btn"
                    title={
                      state.report.totalSales === 0
                        ? "No sales data to export"
                        : ""
                    }
                  >
                    <>
                      <FiDownload className="me-2" />
                      {screenSize.isMobile ? "Export" : "Export CSV"}
                    </>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {state.loading ? (
            <div className="loading-container">
              <div className="loading-content">
                <Spinner animation="border" variant="primary" />
                <h5 className="loading-text">Loading dashboard data...</h5>
                <p className="loading-subtext">
                  Please wait while we fetch your sales analytics
                </p>
              </div>
            </div>
          ) : state.error ? (
            <Alert variant="danger" className="error-alert">
              <div className="error-content">
                <h6 className="error-title">Error loading dashboard</h6>
                <p className="error-message">{state.error}</p>
                <Button
                  variant="outline-danger"
                  onClick={fetchReport}
                  size="sm"
                  className="retry-btn"
                >
                  <FiRefreshCw className="me-2" />
                  Retry
                </Button>
              </div>
            </Alert>
          ) : state.report ? (
            <>
              {/* Summary Cards */}
              <div className="metrics-section">
                <Row className="g-4">
                  {[
                    {
                      icon: <FiShoppingCart size={24} />,
                      title: "Total Sales",
                      value: state.report.totalSales,
                      color: "primary",
                    },
                    {
                      icon: <FiDollarSign size={24} />,
                      title: "Total Revenue",
                      value: `$${state.report.totalRevenue.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 }
                      )}`,
                      color: "success",
                    },
                    {
                      icon: <FiTrendingUp size={24} />,
                      title: "Items Sold",
                      value: state.report.totalItemsSold.toLocaleString(),
                      color: "info",
                    },
                    {
                      icon: <FiDollarSign size={24} />,
                      title: "Discounts Applied",
                      value: `$${state.report.discountsApplied.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 }
                      )}`,
                      color: "warning",
                    },
                  ].map((metric, index) => (
                    <Col xs={12} sm={6} lg={3} key={index}>
                      <Card className="metric-card">
                        <Card.Body>
                          <div className="metric-header">
                            <div className={`metric-icon bg-${metric.color}`}>
                              {metric.icon}
                            </div>
                          </div>
                          <div className="metric-content">
                            <h3 className="metric-value">{metric.value}</h3>
                            <p className="metric-title">{metric.title}</p>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Sales Table */}
              <Card className="data-table-card">
                <Card.Header className="table-header">
                  <div className="table-header-content">
                    <h5 className="table-title">Sales by Day</h5>
                    <Badge bg="light" text="dark" className="record-count">
                      {Object.keys(state.report.salesByDay).length} records
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body className="table-body">
                  {Object.keys(state.report.salesByDay).length > 0 ? (
                    <div className="table-responsive">
                      <Table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Sales Count</th>
                            <th>Revenue</th>
                            <th>Items Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(state.report.salesByDay).map(
                            ([date, revenue]) => {
                              const daySales = state.report.sales.filter(
                                (sale) =>
                                  sale.date &&
                                  format(parseISO(sale.date), "yyyy-MM-dd") ===
                                    date
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
                                  <td className="date-cell">
                                    {format(parseISO(date), "MMM dd, yyyy")}
                                  </td>
                                  <td className="sales-count">
                                    <Badge bg="primary" pill>
                                      {daySales.length}
                                    </Badge>
                                  </td>
                                  <td className="revenue-cell">
                                    $
                                    {Number(revenue).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="items-cell">
                                    {itemsSold.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="no-data-container">
                      <div className="no-data-content">
                        <FiShoppingCart size={48} className="no-data-icon" />
                        <h6 className="no-data-title">
                          No sales data available
                        </h6>
                        <p className="no-data-text">
                          There are no sales records for the selected period.
                          Try adjusting your filters or check back later.
                        </p>
                      </div>
                    </div>
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
