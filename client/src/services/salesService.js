import axios from "axios";

const API_URL = "http://localhost:8000/sale";
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper function to clean params
const cleanParams = (params) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== "" && v !== null
    )
  );
};

export const getSales = async (params = {}) => {
  try {
    const response = await api.get("", {
      params: cleanParams(params),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }
};

export const createSale = async (saleData) => {
  try {
    // Validate items before sending
    if (!saleData.items || saleData.items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Transform data for backend
    const payload = {
      items: saleData.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      })),
      ...(saleData.discount && {
        discount: {
          type: saleData.discount.type,
          value: Number(saleData.discount.value),
          reason: saleData.discount.reason || "",
        },
      }),
    };

    const response = await api.post("", payload);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating sale:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteSale = async (saleId) => {
  try {
    const response = await api.delete(`/${saleId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
};

export const getSaleDetails = async (saleId) => {
  try {
    const response = await api.get(`/${saleId}`);
    console.log("Sale Data", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching sale details:", error);
    throw error;
  }
};

export const extractCashiersFromSales = async () => {
  try {
    const response = await getSales({ limit: 1000 });
    const cashiers = [
      ...new Set(
        response.sales
          .filter((sale) => sale.cashier_id)
          .map((sale) => ({
            id: sale.cashier_id,
            name: sale.cashier?.name || `Cashier ${sale.cashier_id}`,
          }))
      ),
    ];
    return { cashiers };
  } catch (error) {
    console.error("Error extracting cashiers:", error);
    return { cashiers: [] };
  }
};
